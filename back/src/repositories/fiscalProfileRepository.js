'use strict';

/**
 * FiscalProfileRepository
 *
 * Capa de acceso a datos para TenantFiscalProfile.
 * Todas las operaciones filtran por tenantId.
 * Encapsula el cifrado/descifrado de la clave privada.
 */

const prisma = require('../utils/prismaClient');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Busca el perfil fiscal de un tenant.
 * @param {number} tenantId
 * @returns {Promise<object|null>}
 */
async function findByTenantId(tenantId) {
  return prisma.tenantFiscalProfile.findUnique({
    where: { tenantId },
  });
}

/**
 * Crea un perfil fiscal para un tenant.
 * La clave privada NO se acepta aquí; se sube por separado vía `storeCertificateAndKey`.
 *
 * @param {number} tenantId
 * @param {object} data
 * @returns {Promise<object>}
 */
async function create(tenantId, data) {
  return prisma.tenantFiscalProfile.create({
    data: {
      tenantId,
      cuit: data.cuit,
      businessName: data.businessName,
      ivaCondition: data.ivaCondition,
      grossIncomeCondition: data.grossIncomeCondition || null,
      pointOfSale: data.pointOfSale,
      environment: data.environment || 'homologacion',
      onboardingStatus: 'draft',
    },
  });
}

/**
 * Actualiza campos no sensibles del perfil fiscal.
 * Nunca acepta la clave privada directamente; usar `storeCertificateAndKey` para eso.
 *
 * @param {number} id - ID del perfil
 * @param {number} tenantId - Validación de pertenencia
 * @param {object} data
 * @returns {Promise<object>}
 */
async function update(id, tenantId, data) {
  // Extraemos explícitamente para nunca guardar claves en texto plano por accidente
  const {
    cuit,
    businessName,
    ivaCondition,
    grossIncomeCondition,
    pointOfSale,
    environment,
    onboardingStatus,
    wsaaStatus,
    arcaServiceStatus,
    isReadyToInvoice,
    certificateExpiresAt,
  } = data;

  return prisma.tenantFiscalProfile.update({
    where: { id, tenantId },
    data: {
      ...(cuit !== undefined && { cuit }),
      ...(businessName !== undefined && { businessName }),
      ...(ivaCondition !== undefined && { ivaCondition }),
      ...(grossIncomeCondition !== undefined && { grossIncomeCondition }),
      ...(pointOfSale !== undefined && { pointOfSale }),
      ...(environment !== undefined && { environment }),
      ...(onboardingStatus !== undefined && { onboardingStatus }),
      ...(wsaaStatus !== undefined && { wsaaStatus }),
      ...(arcaServiceStatus !== undefined && { arcaServiceStatus }),
      ...(isReadyToInvoice !== undefined && { isReadyToInvoice }),
      ...(certificateExpiresAt !== undefined && { certificateExpiresAt }),
    },
  });
}

/**
 * Almacena el certificado PEM público y la clave privada cifrada.
 * La clave privada se cifra con el mismo mecanismo AES-256-GCM usado en otros tokens.
 *
 * @param {number} tenantId
 * @param {string} certificatePem - Certificado en formato PEM (no sensible)
 * @param {string} privateKeyPem - Clave privada en formato PEM (se cifra antes de persistir)
 * @param {Date|null} expiresAt - Fecha de expiración del certificado
 * @returns {Promise<object>}
 */
async function storeCertificateAndKey(tenantId, certificatePem, privateKeyPem, expiresAt) {
  const encryptedKey = encrypt(privateKeyPem);

  return prisma.tenantFiscalProfile.update({
    where: { tenantId },
    data: {
      certificatePem,
      privateKeyEncrypted: encryptedKey.encrypted,
      privateKeyIv: encryptedKey.iv,
      privateKeyAuthTag: encryptedKey.authTag,
      privateKeySalt: encryptedKey.salt,
      certificateExpiresAt: expiresAt || null,
      onboardingStatus: 'certificate_uploaded',
    },
  });
}

/**
 * Descifra y devuelve la clave privada del perfil.
 * Nunca expone la clave privada en logs ni en responses API.
 *
 * @param {object} profile - Registro TenantFiscalProfile con campos cifrados
 * @returns {string|null} clave privada en PEM
 */
function decryptPrivateKey(profile) {
  if (!profile.privateKeyEncrypted) return null;

  return decrypt({
    encrypted: profile.privateKeyEncrypted,
    iv: profile.privateKeyIv,
    authTag: profile.privateKeyAuthTag,
    salt: profile.privateKeySalt,
  });
}

/**
 * Devuelve el perfil listo para usarlo con ARCA:
 * incluye el certificatePem + la clave privada descifrada.
 * Usar solo en code paths que realmente necesiten autenticar contra AFIP.
 *
 * @param {number} tenantId
 * @returns {Promise<{ profile: object, privateKeyPem: string }|null>}
 */
async function getProfileWithDecryptedKey(tenantId) {
  const profile = await findByTenantId(tenantId);
  if (!profile) return null;

  const privateKeyPem = decryptPrivateKey(profile);
  return { profile, privateKeyPem };
}

module.exports = {
  findByTenantId,
  create,
  update,
  storeCertificateAndKey,
  decryptPrivateKey,
  getProfileWithDecryptedKey,
};
