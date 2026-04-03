'use strict';

/**
 * TenantFiscalProfileService
 *
 * Servicio de dominio que gestiona el ciclo de vida del perfil fiscal de un tenant:
 *  - Creación / actualización del perfil
 *  - Carga segura de certificado y clave privada
 *  - Verificación de conexión con WSAA
 *  - Control del estado de onboarding
 *
 * Usa el repository para persistencia y el arcaAuthAdapter para validar contra AFIP.
 * NUNCA expone la clave privada ni el token/sign en respuestas hacia arriba en la pila.
 */

const fiscalProfileRepository = require('../repositories/fiscalProfileRepository');
const fiscalAuditRepository = require('../repositories/fiscalAuditRepository');
const arcaAuthAdapter = require('../adapters/arca/arcaAuthAdapter');
const logger = require('../utils/logger');
const {
  FiscalProfileNotFoundError,
  CertificateError,
} = require('../adapters/arca/arcaErrors');

// Secuencia oficial de estados de onboarding
const ONBOARDING_STATES = ['draft', 'csr_generated', 'certificate_uploaded', 'service_linked', 'wsaa_verified', 'ready'];

/**
 * Obtiene el perfil fiscal del tenant.
 * Devuelve null si no existe (sin lanzar error — dejar al llamador decidir).
 *
 * @param {number} tenantId
 * @returns {Promise<object|null>}
 */
async function getProfile(tenantId) {
  return fiscalProfileRepository.findByTenantId(tenantId);
}

/**
 * Crea el perfil fiscal inicial de un tenant.
 * Solo se puede crear uno por tenant (unique constraint en BD).
 *
 * @param {number} tenantId
 * @param {object} data
 * @param {string} data.cuit
 * @param {string} data.businessName
 * @param {string} data.ivaCondition
 * @param {string} [data.grossIncomeCondition]
 * @param {number} data.pointOfSale
 * @param {string} [data.environment='homologacion']
 * @param {number} [createdBy]
 * @returns {Promise<object>}
 */
async function createProfile(tenantId, data, createdBy = null) {
  const existing = await fiscalProfileRepository.findByTenantId(tenantId);
  if (existing) {
    throw new Error('El tenant ya tiene un perfil fiscal. Usar updateProfile para modificarlo.');
  }

  const profile = await fiscalProfileRepository.create(tenantId, data);

  await fiscalAuditRepository.log({
    tenantId,
    action: 'profile.created',
    entityType: 'TenantFiscalProfile',
    entityId: profile.id,
    requestData: { cuit: data.cuit, environment: data.environment },
    responseData: null,
    status: 'success',
    createdBy,
  });

  logger.info('Perfil fiscal creado', { tenantId, profileId: profile.id, environment: data.environment });
  return profile;
}

/**
 * Actualiza campos no sensibles del perfil fiscal.
 *
 * @param {number} tenantId
 * @param {object} data
 * @param {number} [createdBy]
 * @returns {Promise<object>}
 */
async function updateProfile(tenantId, data, createdBy = null) {
  const existing = await fiscalProfileRepository.findByTenantId(tenantId);
  if (!existing) {
    throw new FiscalProfileNotFoundError(tenantId);
  }

  const updated = await fiscalProfileRepository.update(existing.id, tenantId, data);

  await fiscalAuditRepository.log({
    tenantId,
    action: 'profile.updated',
    entityType: 'TenantFiscalProfile',
    entityId: existing.id,
    requestData: { fields: Object.keys(data) },
    responseData: null,
    status: 'success',
    createdBy,
  });

  logger.info('Perfil fiscal actualizado', { tenantId, profileId: existing.id });
  return updated;
}

/**
 * Carga el certificado AFIP y la clave privada del tenant de forma segura.
 * La clave privada se cifra en reposo antes de persistir.
 * Invalida el cache de token WSAA tras el cambio.
 *
 * @param {number} tenantId
 * @param {string} certificatePem - Certificado en formato PEM
 * @param {string} privateKeyPem - Clave privada en formato PEM (sin passphrase)
 * @param {number} [createdBy]
 * @returns {Promise<object>} perfil actualizado (SIN clave privada)
 */
async function uploadCertificate(tenantId, certificatePem, privateKeyPem, createdBy = null) {
  const existing = await fiscalProfileRepository.findByTenantId(tenantId);
  if (!existing) {
    throw new FiscalProfileNotFoundError(tenantId);
  }

  // Validar el certificado antes de guardarlo
  const certInfo = arcaAuthAdapter.inspectCertificate(certificatePem);
  if (!certInfo.isValid) {
    throw new CertificateError('El certificado PEM proporcionado no es válido');
  }

  if (certInfo.expiresAt && certInfo.expiresAt < new Date()) {
    throw new CertificateError(
      `El certificado está vencido (venció el ${certInfo.expiresAt.toISOString()}). Renovar en el servicio de ARCA.`
    );
  }

  await fiscalProfileRepository.storeCertificateAndKey(
    tenantId,
    certificatePem,
    privateKeyPem,
    certInfo.expiresAt
  );

  // Invalidar token en cache para forzar re-autenticación con el nuevo cert
  await arcaAuthAdapter.invalidateTokenCache(tenantId, existing.environment);

  await fiscalAuditRepository.log({
    tenantId,
    action: 'profile.certificate_upload',
    entityType: 'TenantFiscalProfile',
    entityId: existing.id,
    // NO registrar certificatePem ni privateKeyPem en el audit log
    requestData: { subject: certInfo.subject, expiresAt: certInfo.expiresAt },
    responseData: null,
    status: 'success',
    createdBy,
  });

  logger.info('Certificado AFIP cargado correctamente', {
    tenantId,
    subject: certInfo.subject,
    expiresAt: certInfo.expiresAt,
  });

  // Devolver perfil sin clave privada
  return fiscalProfileRepository.findByTenantId(tenantId).then(sanitizeProfile);
}

/**
 * Realiza una prueba de conexión contra WSAA para validar el certificado del tenant.
 * Actualiza wsaaStatus y arcaServiceStatus en el perfil.
 *
 * @param {number} tenantId
 * @param {number} [createdBy]
 * @returns {Promise<{ success: boolean, token: boolean, profile: object }>}
 */
async function testWsaaConnection(tenantId, createdBy = null) {
  const profileData = await fiscalProfileRepository.getProfileWithDecryptedKey(tenantId);
  if (!profileData) {
    throw new FiscalProfileNotFoundError(tenantId);
  }

  const { profile, privateKeyPem } = profileData;

  if (!profile.certificatePem || !privateKeyPem) {
    throw new CertificateError(
      'El perfil fiscal no tiene certificado ni clave privada cargados. Completar el onboarding primero.'
    );
  }

  let tokenData;
  let wsaaOk = false;
  let errorMessage = null;

  try {
    tokenData = await arcaAuthAdapter.getTokenAndSign({
      tenantId,
      environment: profile.environment,
      certificatePem: profile.certificatePem,
      privateKeyPem,
    });
    wsaaOk = !!tokenData.token;
  } catch (err) {
    errorMessage = err.message;
    logger.warn('Prueba WSAA fallida', { tenantId, environment: profile.environment, error: err.message });
  }

  // Determinar el siguiente estado de onboarding
  const nextStatus = wsaaOk
    ? advanceOnboarding(profile.onboardingStatus, 'wsaa_verified')
    : profile.onboardingStatus;

  const updatedProfile = await fiscalProfileRepository.update(profile.id, tenantId, {
    wsaaStatus: wsaaOk ? 'verified' : 'error',
    arcaServiceStatus: wsaaOk ? 'linked' : 'error',
    isReadyToInvoice: wsaaOk && nextStatus === 'ready',
    onboardingStatus: nextStatus,
  });

  await fiscalAuditRepository.log({
    tenantId,
    action: 'profile.wsaa_test',
    entityType: 'TenantFiscalProfile',
    entityId: profile.id,
    requestData: { environment: profile.environment },
    // NO incluir token ni sign en el audit log
    responseData: { success: wsaaOk },
    status: wsaaOk ? 'success' : 'failure',
    errorMessage,
    createdBy,
  });

  logger.info('Resultado prueba WSAA', {
    tenantId,
    environment: profile.environment,
    success: wsaaOk,
    onboardingStatus: nextStatus,
  });

  return {
    success: wsaaOk,
    errorMessage,
    profile: sanitizeProfile(updatedProfile),
  };
}

/**
 * Avanza el estado de onboarding si el nuevo estado es posterior al actual.
 * No permite retroceder el estado.
 *
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @returns {string}
 */
function advanceOnboarding(currentStatus, targetStatus) {
  const currentIdx = ONBOARDING_STATES.indexOf(currentStatus);
  const targetIdx = ONBOARDING_STATES.indexOf(targetStatus);

  if (targetIdx > currentIdx) {
    // Si el nuevo estado es 'wsaa_verified', el siguiente es 'ready'
    if (targetStatus === 'wsaa_verified') return 'ready';
    return targetStatus;
  }

  return currentStatus;
}

/**
 * Elimina campos sensibles del perfil antes de devolver al controller.
 * Nunca debe exponerse el material criptográfico vía API.
 *
 * @param {object} profile
 * @returns {object}
 */
function sanitizeProfile(profile) {
  if (!profile) return null;

  const {
    privateKeyEncrypted,
    privateKeyIv,
    privateKeyAuthTag,
    privateKeySalt,
    // certificatePem se puede compartir (es público), pero lo omitimos igualmente
    // para no saturar la respuesta. El frontend no lo necesita.
    certificatePem,
    ...safe
  } = profile;

  return safe;
}

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  uploadCertificate,
  testWsaaConnection,
  sanitizeProfile,
};
