'use strict';

/**
 * ElectronicInvoiceController
 *
 * Controlador HTTP para el módulo de facturación electrónica ARCA/AFIP.
 *
 * Responsabilidades:
 *  - Parsear y validar el input del request (bodies, params, query)
 *  - Extraer tenantId y userId del contexto del request (middleware)
 *  - Delegar al service correspondiente
 *  - Mapear errores del dominio a respuestas HTTP correctas
 *  - NUNCA contener lógica SOAP, XML, certificados, ni queries Prisma
 *
 * Todos los endpoints usan req.tenantId como fuente de verdad.
 * req.tenant.features.electronic_invoicing se verifica en el router con requireFeature.
 */

const tenantFiscalProfileService = require('../services/tenantFiscalProfileService');
const electronicInvoiceService = require('../services/electronicInvoiceService');
const fiscalAuditRepository = require('../repositories/fiscalAuditRepository');
const logger = require('../utils/logger');
const {
  FiscalProfileNotFoundError,
  NotReadyToInvoiceError,
  DuplicateInvoiceError,
  InvoiceTenantMismatchError,
  InvoiceRejectedByArcaError,
  CertificateError,
  ArcaAuthError,
  ArcaInvoiceError,
} = require('../adapters/arca/arcaErrors');

// ─── Perfil Fiscal ─────────────────────────────────────────────────────────

/**
 * GET /fiscal/profile
 * Obtiene el perfil fiscal del tenant actual.
 */
async function getProfile(req, res) {
  try {
    const profile = await tenantFiscalProfileService.getProfile(req.tenantId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'FISCAL_PROFILE_NOT_FOUND',
        message: 'El tenant no tiene un perfil fiscal configurado. Completar el onboarding primero.',
      });
    }

    return res.status(200).json({
      success: true,
      profile: tenantFiscalProfileService.sanitizeProfile(profile),
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'getProfile');
  }
}

/**
 * POST /fiscal/profile
 * Crea el perfil fiscal del tenant.
 * Body: { cuit, businessName, ivaCondition, grossIncomeCondition?, pointOfSale, environment? }
 */
async function createProfile(req, res) {
  const { cuit, businessName, ivaCondition, grossIncomeCondition, pointOfSale, environment } = req.body;

  if (!cuit || !businessName || !ivaCondition || !pointOfSale) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Campos requeridos: cuit, businessName, ivaCondition, pointOfSale',
    });
  }

  if (!isValidCuit(cuit)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'El CUIT ingresado no es válido. Formato esperado: XX-XXXXXXXX-X',
    });
  }

  if (environment && !['homologacion', 'produccion'].includes(environment)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'El campo environment debe ser "homologacion" o "produccion"',
    });
  }

  try {
    const profile = await tenantFiscalProfileService.createProfile(
      req.tenantId,
      { cuit, businessName, ivaCondition, grossIncomeCondition, pointOfSale: Number(pointOfSale), environment },
      req.user?.adminId || null
    );

    return res.status(201).json({
      success: true,
      message: 'Perfil fiscal creado. Continuar con la carga del certificado AFIP.',
      profile: tenantFiscalProfileService.sanitizeProfile(profile),
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'createProfile');
  }
}

/**
 * PATCH /fiscal/profile
 * Actualiza campos no sensibles del perfil fiscal.
 */
async function updateProfile(req, res) {
  const allowed = ['businessName', 'ivaCondition', 'grossIncomeCondition', 'pointOfSale', 'environment'];
  const data = {};

  for (const field of allowed) {
    if (req.body[field] !== undefined) {
      data[field] = field === 'pointOfSale' ? Number(req.body[field]) : req.body[field];
    }
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: `No se recibieron campos válidos para actualizar. Campos permitidos: ${allowed.join(', ')}`,
    });
  }

  try {
    const updated = await tenantFiscalProfileService.updateProfile(req.tenantId, data, req.user?.adminId || null);

    return res.status(200).json({
      success: true,
      message: 'Perfil fiscal actualizado.',
      profile: tenantFiscalProfileService.sanitizeProfile(updated),
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'updateProfile');
  }
}

/**
 * POST /fiscal/profile/certificate
 * Sube el certificado AFIP y la clave privada del tenant.
 * Body: { certificatePem: string, privateKeyPem: string }
 *
 * IMPORTANTE: Este endpoint debe usarse solo sobre HTTPS.
 * Considerar agregar rate limiting estricto en el router.
 */
async function uploadCertificate(req, res) {
  const { certificatePem, privateKeyPem } = req.body;

  if (!certificatePem || !privateKeyPem) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Se requieren los campos certificatePem y privateKeyPem en formato PEM',
    });
  }

  if (!certificatePem.includes('-----BEGIN CERTIFICATE-----')) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'certificatePem no tiene formato PEM válido',
    });
  }

  if (!privateKeyPem.includes('-----BEGIN') || !privateKeyPem.includes('PRIVATE KEY-----')) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'privateKeyPem no tiene formato PEM válido',
    });
  }

  try {
    const profile = await tenantFiscalProfileService.uploadCertificate(
      req.tenantId,
      certificatePem,
      privateKeyPem,
      req.user?.adminId || null
    );

    return res.status(200).json({
      success: true,
      message: 'Certificado cargado correctamente. Ejecutar la prueba de conexión para verificar.',
      profile,
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'uploadCertificate');
  }
}

/**
 * POST /fiscal/profile/test-connection
 * Realiza una prueba de autenticación contra WSAA con el certificado del tenant.
 */
async function testConnection(req, res) {
  try {
    const result = await tenantFiscalProfileService.testWsaaConnection(
      req.tenantId,
      req.user?.adminId || null
    );

    return res.status(200).json({
      success: result.success,
      message: result.success
        ? 'Conexión con AFIP/ARCA exitosa. El perfil está listo para facturar.'
        : `Error al conectar con AFIP/ARCA: ${result.errorMessage}`,
      profile: result.profile,
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'testConnection');
  }
}

// ─── Facturas ──────────────────────────────────────────────────────────────

/**
 * GET /invoices
 * Lista las facturas del tenant con paginación y filtros opcionales.
 * Query: ?page=1&limit=20&status=authorized&invoiceType=6&pointOfSale=1
 */
async function listInvoices(req, res) {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: Math.min(parseInt(req.query.limit) || 20, 100),
    status: req.query.status || undefined,
    invoiceType: req.query.invoiceType ? parseInt(req.query.invoiceType) : undefined,
    pointOfSale: req.query.pointOfSale ? parseInt(req.query.pointOfSale) : undefined,
  };

  try {
    const result = await electronicInvoiceService.listInvoices(req.tenantId, filters);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'listInvoices');
  }
}

/**
 * GET /invoices/:id
 * Obtiene una factura por ID. Incluye QR si está autorizada.
 */
async function getInvoice(req, res) {
  const invoiceId = parseInt(req.params.id);
  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'ID inválido' });
  }

  try {
    const invoice = await electronicInvoiceService.getInvoice(req.tenantId, invoiceId);

    return res.status(200).json({ success: true, invoice });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'getInvoice');
  }
}

/**
 * POST /invoices/draft
 * Crea una factura en estado borrador sin contactar ARCA.
 *
 * Body:
 * {
 *   customerName, customerDocType, customerDocNumber,
 *   invoiceType, pointOfSale, concept,
 *   currency?, exchangeRate?,
 *   netAmount, taxAmount, totalAmount,
 *   serviceFromDate?, serviceToDate?, dueDate?,
 *   items?: [{ description, quantity, unitPrice, subtotal, taxRate }]
 * }
 */
async function createDraft(req, res) {
  const {
    customerName, customerDocType, customerDocNumber,
    invoiceType, pointOfSale, concept,
    currency, exchangeRate,
    netAmount, taxAmount, totalAmount,
    serviceFromDate, serviceToDate, dueDate,
    items,
  } = req.body;

  // Validaciones básicas de campos requeridos
  const missing = [];
  if (!customerName) missing.push('customerName');
  if (customerDocType === undefined || customerDocType === null) missing.push('customerDocType');
  if (!customerDocNumber) missing.push('customerDocNumber');
  if (!invoiceType) missing.push('invoiceType');
  if (!pointOfSale) missing.push('pointOfSale');
  if (concept === undefined || concept === null) missing.push('concept');
  if (netAmount === undefined) missing.push('netAmount');
  if (taxAmount === undefined) missing.push('taxAmount');
  if (totalAmount === undefined) missing.push('totalAmount');

  if (missing.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: `Campos requeridos faltantes: ${missing.join(', ')}`,
    });
  }

  // Servicios (concept 2 o 3) requieren fechas
  if ((concept === 2 || concept === 3) && (!serviceFromDate || !serviceToDate || !dueDate)) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Para concept=2 o concept=3 (servicios) se requieren serviceFromDate, serviceToDate y dueDate en formato YYYYMMDD',
    });
  }

  try {
    const invoice = await electronicInvoiceService.createDraft(
      req.tenantId,
      {
        customerName,
        customerDocType: Number(customerDocType),
        customerDocNumber: String(customerDocNumber),
        invoiceType: Number(invoiceType),
        pointOfSale: Number(pointOfSale),
        concept: Number(concept),
        currency: currency || 'PES',
        exchangeRate: exchangeRate ? Number(exchangeRate) : 1,
        netAmount: Number(netAmount),
        taxAmount: Number(taxAmount),
        totalAmount: Number(totalAmount),
        serviceFromDate: serviceFromDate || null,
        serviceToDate: serviceToDate || null,
        dueDate: dueDate || null,
      },
      Array.isArray(items) ? items : [],
      req.user?.adminId || null
    );

    return res.status(201).json({
      success: true,
      message: 'Factura borrador creada. Llamar a POST /invoices/:id/authorize para obtener el CAE.',
      invoice,
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'createDraft');
  }
}

/**
 * POST /invoices/:id/authorize
 * Envía la factura a ARCA para obtener el CAE (autorización fiscal).
 */
async function authorizeInvoice(req, res) {
  const invoiceId = parseInt(req.params.id);
  if (!invoiceId || isNaN(invoiceId)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'ID inválido' });
  }

  try {
    const invoice = await electronicInvoiceService.authorizeInvoice(
      req.tenantId,
      invoiceId,
      req.user?.adminId || null
    );

    return res.status(200).json({
      success: true,
      message: `Factura autorizada por AFIP/ARCA. CAE: ${invoice.cae}`,
      invoice,
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'authorizeInvoice');
  }
}

/**
 * POST /invoices/:id/credit-note
 * Emite una nota de crédito sobre una factura autorizada.
 *
 * Body: { netAmount, taxAmount, totalAmount, concept?, items? }
 */
async function issueCreditNote(req, res) {
  const originalId = parseInt(req.params.id);
  if (!originalId || isNaN(originalId)) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'ID inválido' });
  }

  const { netAmount, taxAmount, totalAmount, concept, serviceFromDate, serviceToDate, dueDate, items } = req.body;

  if (netAmount === undefined || taxAmount === undefined || totalAmount === undefined) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Se requieren netAmount, taxAmount y totalAmount para la nota de crédito',
    });
  }

  try {
    const nc = await electronicInvoiceService.issueCreditNote(
      req.tenantId,
      originalId,
      {
        netAmount: Number(netAmount),
        taxAmount: Number(taxAmount),
        totalAmount: Number(totalAmount),
        concept: concept ? Number(concept) : undefined,
        serviceFromDate: serviceFromDate || null,
        serviceToDate: serviceToDate || null,
        dueDate: dueDate || null,
        items: Array.isArray(items) ? items : [],
      },
      req.user?.adminId || null
    );

    return res.status(201).json({
      success: true,
      message: `Nota de crédito emitida. CAE: ${nc.cae}`,
      invoice: nc,
    });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'issueCreditNote');
  }
}

/**
 * GET /fiscal/audit
 * Lista el audit log fiscal del tenant.
 */
async function getAuditLog(req, res) {
  const { page = 1, limit = 50, entityType, action } = req.query;

  try {
    const result = await fiscalAuditRepository.findMany(req.tenantId, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 200),
      entityType,
      action,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return handleError(res, err, req.tenantId, 'getAuditLog');
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Mapea errores del dominio fiscal a respuestas HTTP apropiadas.
 * Los errores técnicos producen 502 (Bad Gateway) ya que el fallo está en AFIP/ARCA.
 * Los errores funcionales producen 4xx.
 *
 * @param {object} res
 * @param {Error} err
 * @param {number} tenantId
 * @param {string} source
 */
function handleError(res, err, tenantId, source) {
  logger.error(`ElectronicInvoiceController error in ${source}`, {
    tenantId,
    errorName: err.name,
    errorCode: err.code,
    message: err.message,
  });

  if (err instanceof FiscalProfileNotFoundError) {
    return res.status(404).json({ success: false, error: err.code, message: err.message });
  }

  if (err instanceof NotReadyToInvoiceError) {
    return res.status(409).json({
      success: false,
      error: err.code,
      message: err.message,
      onboardingStatus: err.onboardingStatus,
    });
  }

  if (err instanceof DuplicateInvoiceError) {
    return res.status(409).json({ success: false, error: err.code, message: err.message });
  }

  if (err instanceof InvoiceTenantMismatchError) {
    return res.status(404).json({ success: false, error: err.code, message: err.message });
  }

  if (err instanceof InvoiceRejectedByArcaError) {
    return res.status(422).json({
      success: false,
      error: err.code,
      message: err.message,
      observations: err.observations,
    });
  }

  if (err instanceof CertificateError) {
    return res.status(400).json({ success: false, error: err.code, message: err.message });
  }

  // Errores técnicos de ARCA (SOAP, red) → 502 para que el cliente sepa reintentar
  if (err instanceof ArcaAuthError || err instanceof ArcaInvoiceError) {
    return res.status(502).json({
      success: false,
      error: err.code,
      message: 'Error de comunicación con AFIP/ARCA. Es posible que el servicio esté no disponible.',
      detail: err.message,
    });
  }

  // Error de "ya existe" (Prisma unique constraint) al crear perfil duplicado
  if (err.message && err.message.includes('ya tiene un perfil fiscal')) {
    return res.status(409).json({
      success: false,
      error: 'PROFILE_ALREADY_EXISTS',
      message: err.message,
    });
  }

  // Fallback: error interno no previsto
  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'Error interno del servidor. Contactar al soporte.',
  });
}

/**
 * Validación de CUIT argentino.
 * Acepta formatos: XXXXXXXXXXX, XX-XXXXXXXX-X
 */
function isValidCuit(cuit) {
  const clean = String(cuit).replace(/-/g, '');
  if (!/^\d{11}$/.test(clean)) return false;

  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = mult.reduce((acc, m, i) => acc + m * parseInt(clean[i]), 0);
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return parseInt(clean[10]) === checkDigit;
}

module.exports = {
  // Perfil fiscal
  getProfile,
  createProfile,
  updateProfile,
  uploadCertificate,
  testConnection,
  // Facturas
  listInvoices,
  getInvoice,
  createDraft,
  authorizeInvoice,
  issueCreditNote,
  // Auditoría
  getAuditLog,
};
