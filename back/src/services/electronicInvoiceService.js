'use strict';

/**
 * ElectronicInvoiceService
 *
 * Servicio de dominio para el ciclo de vida completo de la factura electrónica:
 *  - Crear borrador (draft)
 *  - Autorizar contra ARCA (solicitar CAE)
 *  - Consultar factura individual
 *  - Listar facturas del tenant
 *  - Emitir nota de crédito (NC)
 *
 * Orquesta:
 *  - electronicInvoiceRepository (persistencia)
 *  - fiscalProfileRepository (leer perfil y descifrar clave)
 *  - fiscalAuditRepository (auditoría)
 *  - arcaAuthAdapter (token/sign WSAA)
 *  - arcaInvoiceAdapter (FECompUltimoAutorizado + FECAESolicitar)
 *
 * Garantías de aislamiento:
 *  - Toda query Prisma usa tenantId del contexto del request
 *  - El perfil fiscal se carga siempre por tenantId
 *  - Nunca se usa un perfil de otro tenant
 */

const electronicInvoiceRepository = require('../repositories/electronicInvoiceRepository');
const fiscalProfileRepository = require('../repositories/fiscalProfileRepository');
const fiscalAuditRepository = require('../repositories/fiscalAuditRepository');
const arcaAuthAdapter = require('../adapters/arca/arcaAuthAdapter');
const arcaInvoiceAdapter = require('../adapters/arca/arcaInvoiceAdapter');
const logger = require('../utils/logger');
const {
  FiscalProfileNotFoundError,
  NotReadyToInvoiceError,
  DuplicateInvoiceError,
  InvoiceTenantMismatchError,
  InvoiceRejectedByArcaError,
  CertificateError,
} = require('../adapters/arca/arcaErrors');

// Alícuotas IVA estándar para Argentina
const IVA_RATES = {
  0: 3,    // 0%   → Id AFIP: 3
  2.5: 9,  // 2.5% → Id AFIP: 9
  5: 8,    // 5%   → Id AFIP: 8
  10.5: 4, // 10.5%→ Id AFIP: 4
  21: 5,   // 21%  → Id AFIP: 5
  27: 6,   // 27%  → Id AFIP: 6
};

// Tipos de comprobante permitidos para NC (nota de crédito)
const CREDIT_NOTE_TYPES = {
  1: 3,   // FC-A → NC-A
  6: 8,   // FC-B → NC-B
  11: 13, // FC-C → NC-C
};

/**
 * Crea una factura en estado draft sin contactar ARCA.
 *
 * @param {number} tenantId
 * @param {object} invoiceData
 * @param {object[]} [items=[]]
 * @param {number} [createdBy]
 * @returns {Promise<object>}
 */
async function createDraft(tenantId, invoiceData, items = [], createdBy = null) {
  const profile = await fiscalProfileRepository.findByTenantId(tenantId);
  if (!profile) {
    throw new FiscalProfileNotFoundError(tenantId);
  }

  if (!profile.isReadyToInvoice) {
    throw new NotReadyToInvoiceError(profile.onboardingStatus);
  }

  const invoice = await electronicInvoiceRepository.createDraft(
    tenantId,
    profile.id,
    { ...invoiceData, createdBy },
    items
  );

  logger.info('Factura borrador creada', {
    tenantId,
    invoiceId: invoice.id,
    invoiceType: invoiceData.invoiceType,
    total: invoiceData.totalAmount,
  });

  return invoice;
}

/**
 * Autoriza una factura contra ARCA (solicita CAE).
 *
 * Flujo:
 *  1. Cargar factura y verificar que pertenece al tenant
 *  2. Verificar que está en estado 'draft' (idempotencia)
 *  3. Cargar perfil fiscal y descifrar clave privada
 *  4. Obtener token/sign de WSAA
 *  5. Obtener último número y calcular el siguiente
 *  6. Llamar FECAESolicitar
 *  7. Persistir resultado (authorized o rejected)
 *  8. Registrar en audit log
 *
 * @param {number} tenantId
 * @param {number} invoiceId
 * @param {number} [authorizedBy]
 * @returns {Promise<object>} factura autorizada
 */
async function authorizeInvoice(tenantId, invoiceId, authorizedBy = null) {
  // 1. Cargar factura verificando aislamiento por tenant
  const invoice = await electronicInvoiceRepository.findById(invoiceId, tenantId);
  if (!invoice) {
    throw new InvoiceTenantMismatchError();
  }

  // 2. Idempotencia: solo se puede autorizar una factura en estado 'draft'
  if (invoice.arcaStatus === 'authorized') {
    logger.info('Factura ya está autorizada, retornando existente', { tenantId, invoiceId });
    return invoice;
  }

  if (invoice.arcaStatus === 'pending_authorization') {
    throw new DuplicateInvoiceError(invoiceId);
  }

  if (invoice.arcaStatus !== 'draft') {
    throw new Error(
      `No se puede autorizar una factura en estado "${invoice.arcaStatus}". Solo facturas en estado "draft".`
    );
  }

  // 3. Cargar perfil fiscal con clave privada descifrada
  const profileData = await fiscalProfileRepository.getProfileWithDecryptedKey(tenantId);
  if (!profileData) {
    throw new FiscalProfileNotFoundError(tenantId);
  }

  const { profile, privateKeyPem } = profileData;

  if (!profile.isReadyToInvoice) {
    throw new NotReadyToInvoiceError(profile.onboardingStatus);
  }

  if (!profile.certificatePem || !privateKeyPem) {
    throw new CertificateError('No hay certificado ni clave privada cargados en el perfil fiscal.');
  }

  // Verificar vencimiento del certificado
  if (profile.certificateExpiresAt && profile.certificateExpiresAt < new Date()) {
    throw new CertificateError(
      `El certificado AFIP del tenant está vencido (${profile.certificateExpiresAt.toISOString()}). Renovar.`
    );
  }

  // Marcar como pendiente para prevenir doble envío concurrente
  await electronicInvoiceRepository.markAsPendingAuthorization(invoiceId, tenantId);

  // 4. Obtener token/sign WSAA (cacheado en Redis)
  const { token, sign } = await arcaAuthAdapter.getTokenAndSign({
    tenantId,
    environment: profile.environment,
    certificatePem: profile.certificatePem,
    privateKeyPem,
  });

  const cuitSanitized = profile.cuit.replace(/-/g, '');

  // 5. Obtener último número de comprobante y calcular el siguiente
  const lastNumber = await arcaInvoiceAdapter.getLastInvoiceNumber({
    environment: profile.environment,
    cuit: cuitSanitized,
    token,
    sign,
    pointOfSale: invoice.pointOfSale,
    invoiceType: invoice.invoiceType,
  });

  const nextInvoiceNumber = lastNumber + 1;

  // Formatear fecha de emisión para AFIP (YYYYMMDD)
  const issuedDate = arcaInvoiceAdapter.toAfipDate(new Date());

  // Preparar desglose IVA si aplica (para facturas A y B con IVA discriminado)
  const taxBreakdown = buildTaxBreakdown(invoice);

  // 6. Solicitar CAE a AFIP
  let arcaResult;
  try {
    arcaResult = await arcaInvoiceAdapter.requestCAE({
      environment: profile.environment,
      cuit: cuitSanitized,
      token,
      sign,
      invoiceData: {
        invoiceType: invoice.invoiceType,
        pointOfSale: invoice.pointOfSale,
        invoiceNumber: nextInvoiceNumber,
        concept: invoice.concept,
        customerDocType: invoice.customerDocType,
        customerDocNumber: invoice.customerDocNumber,
        issuedDate,
        netAmount: invoice.netAmount,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        exchangeRate: invoice.exchangeRate,
        serviceFromDate: invoice.serviceFromDate,
        serviceToDate: invoice.serviceToDate,
        dueDate: invoice.dueDate,
        taxBreakdown,
      },
    });
  } catch (arcaErr) {
    // Error técnico (SOAP, red) → volvemos a 'draft' para permitir reintento
    await electronicInvoiceRepository.updateRejected(invoiceId, tenantId, {
      errorMessage: arcaErr.message,
      rawRequest: null,
      rawResponse: null,
    });

    await fiscalAuditRepository.log({
      tenantId,
      action: 'invoice.authorize_error',
      entityType: 'ElectronicInvoice',
      entityId: invoiceId,
      requestData: { invoiceType: invoice.invoiceType, pointOfSale: invoice.pointOfSale },
      responseData: null,
      status: 'failure',
      errorMessage: arcaErr.message,
      createdBy: authorizedBy,
    });

    throw arcaErr;
  }

  // 7. En base al resultado de ARCA: authorized o rejected
  let finalInvoice;

  if (arcaResult.resultado === 'A') {
    // Autorizado
    finalInvoice = await electronicInvoiceRepository.updateAuthorized(invoiceId, tenantId, {
      invoiceNumber: arcaResult.invoiceNumber,
      cae: arcaResult.cae,
      caeExpiresAt: arcaResult.caeExpiresAt,
      rawRequest: sanitizeRawRequest(arcaResult.rawRequest),
      rawResponse: arcaResult.rawResponse,
      issuedAt: new Date(),
    });

    await fiscalAuditRepository.log({
      tenantId,
      action: 'invoice.authorized',
      entityType: 'ElectronicInvoice',
      entityId: invoiceId,
      requestData: { invoiceNumber: arcaResult.invoiceNumber, invoiceType: invoice.invoiceType },
      responseData: { cae: arcaResult.cae, caeExpiresAt: arcaResult.caeExpiresAt },
      status: 'success',
      createdBy: authorizedBy,
    });

    logger.info('Factura autorizada por ARCA/AFIP', {
      tenantId,
      invoiceId,
      invoiceNumber: arcaResult.invoiceNumber,
      cae: arcaResult.cae,
    });
  } else {
    // Rechazado
    const errorMsg = arcaResult.observations.map((o) => `[${o.code}] ${o.message}`).join('; ');

    finalInvoice = await electronicInvoiceRepository.updateRejected(invoiceId, tenantId, {
      errorMessage: errorMsg,
      rawRequest: sanitizeRawRequest(arcaResult.rawRequest),
      rawResponse: arcaResult.rawResponse,
    });

    await fiscalAuditRepository.log({
      tenantId,
      action: 'invoice.rejected',
      entityType: 'ElectronicInvoice',
      entityId: invoiceId,
      requestData: { invoiceType: invoice.invoiceType, pointOfSale: invoice.pointOfSale },
      responseData: { observations: arcaResult.observations },
      status: 'failure',
      errorMessage: errorMsg,
      createdBy: authorizedBy,
    });

    logger.warn('Factura rechazada por ARCA/AFIP', {
      tenantId,
      invoiceId,
      observations: arcaResult.observations,
    });

    throw new InvoiceRejectedByArcaError(arcaResult.observations);
  }

  return finalInvoice;
}

/**
 * Obtiene una factura por ID garantizando que pertenece al tenant.
 * Puede incluir la URL del QR si la factura está autorizada.
 *
 * @param {number} tenantId
 * @param {number} invoiceId
 * @returns {Promise<object>}
 */
async function getInvoice(tenantId, invoiceId) {
  const invoice = await electronicInvoiceRepository.findById(invoiceId, tenantId);
  if (!invoice) {
    throw new InvoiceTenantMismatchError();
  }

  if (invoice.arcaStatus === 'authorized' && invoice.cae) {
    invoice.qrUrl = arcaInvoiceAdapter.generateQrUrl({
      cuit: invoice.fiscalProfile?.cuit || '',
      pointOfSale: invoice.pointOfSale,
      invoiceType: invoice.invoiceType,
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.issuedAt
        ? arcaInvoiceAdapter.toAfipDate(invoice.issuedAt)
        : null,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      cae: invoice.cae,
      customerDocType: invoice.customerDocType,
      customerDocNumber: invoice.customerDocNumber,
    });
  }

  return invoice;
}

/**
 * Lista las facturas del tenant con paginación.
 *
 * @param {number} tenantId
 * @param {object} filters
 * @returns {Promise<object>}
 */
async function listInvoices(tenantId, filters = {}) {
  return electronicInvoiceRepository.findMany(tenantId, filters);
}

/**
 * Emite una nota de crédito basada en una factura autorizada existente.
 * La NC es una factura nueva con el tipo de comprobante correcto (3/8/13).
 *
 * @param {number} tenantId
 * @param {number} originalInvoiceId - ID de la factura a acreditar
 * @param {object} ncData - Datos de la NC (montos, concepto)
 * @param {number} [createdBy]
 * @returns {Promise<object>} factura NC autorizada
 */
async function issueCreditNote(tenantId, originalInvoiceId, ncData, createdBy = null) {
  const original = await electronicInvoiceRepository.findById(originalInvoiceId, tenantId);
  if (!original) {
    throw new InvoiceTenantMismatchError();
  }

  if (original.arcaStatus !== 'authorized') {
    throw new Error(
      `Solo se puede emitir nota de crédito de facturas autorizadas. Estado actual: ${original.arcaStatus}`
    );
  }

  const ncType = CREDIT_NOTE_TYPES[original.invoiceType];
  if (!ncType) {
    throw new Error(
      `No existe tipo de NC para el tipo de factura ${original.invoiceType}`
    );
  }

  // Crear el draft de la NC con los datos de la operación
  const ncDraft = await createDraft(
    tenantId,
    {
      customerName: original.customerName,
      customerDocType: original.customerDocType,
      customerDocNumber: original.customerDocNumber,
      invoiceType: ncType,
      pointOfSale: original.pointOfSale,
      concept: ncData.concept || original.concept,
      currency: original.currency,
      exchangeRate: original.exchangeRate,
      netAmount: ncData.netAmount,
      taxAmount: ncData.taxAmount,
      totalAmount: ncData.totalAmount,
      serviceFromDate: ncData.serviceFromDate || null,
      serviceToDate: ncData.serviceToDate || null,
      dueDate: ncData.dueDate || null,
    },
    ncData.items || [],
    createdBy
  );

  // Autorizar la NC inmediatamente
  return authorizeInvoice(tenantId, ncDraft.id, createdBy);
}

// ─── Helpers privados ───────────────────────────────────────────────────────

/**
 * Construye el desglose de alícuotas IVA esperado por AFIP si la factura lo necesita.
 * Para FC-C / consumidor final el IVA no va discriminado.
 *
 * @param {object} invoice
 * @returns {Array|null}
 */
function buildTaxBreakdown(invoice) {
  // Los tipos A y B requieren IVA discriminado si taxAmount > 0
  const discriminatedTypes = [1, 2, 3, 6, 7, 8]; // FC-A, ND-A, NC-A, FC-B, ND-B, NC-B
  if (!discriminatedTypes.includes(invoice.invoiceType)) return null;
  if (Number(invoice.taxAmount) === 0) return null;

  // Si el total = neto + 21% IVA, usamos tasa 21%
  // En un sistema real esto debería venir como campo en la factura
  const ivaId = IVA_RATES[21]; // defaultear a 21%

  return [
    {
      ivaId,
      baseAmount: Number(invoice.netAmount),
      taxAmount: Number(invoice.taxAmount),
    },
  ];
}

/**
 * Elimina el token y sign del raw request antes de persistirlo.
 * Los tokens de WSAA no deben guardarse en texto plano en la BD.
 *
 * @param {object|null} rawRequest
 * @returns {object|null}
 */
function sanitizeRawRequest(rawRequest) {
  if (!rawRequest) return null;
  const clean = JSON.parse(JSON.stringify(rawRequest));
  if (clean.FeCAEReq && clean.Auth) {
    clean.Auth = { Token: '[REDACTED]', Sign: '[REDACTED]', Cuit: clean.Auth.Cuit };
  }
  return clean;
}

module.exports = {
  createDraft,
  authorizeInvoice,
  getInvoice,
  listInvoices,
  issueCreditNote,
};
