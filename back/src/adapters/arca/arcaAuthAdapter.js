'use strict';

/**
 * ArcaAuthAdapter – adaptador para WSAA (Web Services Authentication and Authorization)
 *
 * Responsabilidades:
 *  - Generar el TRA (Ticket de Requerimiento de Acceso) en XML
 *  - Firmarlo con el certificado + clave privada del tenant (CMS/PKCS#7)
 *  - Enviarlo a WSAA vía SOAP y obtener el token/sign
 *  - Cachear el token por namespace `arca:wsaa:{tenantId}:{environment}` usando Redis
 *  - Parsear la respuesta del TA (Ticket de Acceso)
 *
 * El adapter NO conoce nada del dominio inmobiliario ni de Prisma.
 * Solo sabe hablar con AFIP/ARCA.
 *
 * Dependencias externas requeridas:
 *   npm install soap node-forge
 */

const forge = require('node-forge');
const soap = require('soap');
const { getRedisClient } = require('../../utils/redis');
const logger = require('../../utils/logger');
const { ArcaAuthError } = require('./arcaErrors');

// URLs WSDL de WSAA según ambiente
const WSAA_WSDL = {
  homologacion: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?WSDL',
  produccion: 'https://wsaa.afip.gov.ar/ws/services/LoginCms?WSDL',
};

// Nombre del servicio que se solicita autorización
const WSFE_SERVICE_NAME = 'wsfe';

// El token WSAA dura 12 horas; cacheamos por 10h para renovar antes del vencimiento
const TOKEN_TTL_SECONDS = 36000;

/**
 * Construye el TRA (Ticket de Requerimiento de Acceso) como XML.
 * @param {string} serviceId - Por ejemplo 'wsfe'
 * @returns {string} XML del TRA
 */
function buildTRA(serviceId) {
  const now = new Date();
  // AFIP requiere generationTime un minuto antes para evitar problemas de sincronización
  const genTime = new Date(now.getTime() - 60 * 1000);
  const expTime = new Date(now.getTime() + 43200 * 1000); // 12h

  // Formato ISO con timezone Argentina (-03:00)
  const toAfipIso = (d) => d.toISOString().slice(0, 19) + '-03:00';

  // uniqueId: epoch en segundos, suficiente para evitar colisiones en ventana de 12h
  const uniqueId = Math.floor(Date.now() / 1000);

  return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${uniqueId}</uniqueId>
    <generationTime>${toAfipIso(genTime)}</generationTime>
    <expirationTime>${toAfipIso(expTime)}</expirationTime>
  </header>
  <service>${serviceId}</service>
</loginTicketRequest>`;
}

/**
 * Firma el TRA con el certificado y la clave privada del tenant usando PKCS#7 (CMS).
 * Devuelve el CMS en Base64, que es exactamente lo que espera WSAA en el campo `in0`.
 *
 * @param {string} traXml - XML del TRA
 * @param {string} certificatePem - Certificado del tenant en formato PEM
 * @param {string} privateKeyPem - Clave privada del tenant en formato PEM (sin passphrase)
 * @returns {string} Base64 del CMS firmado
 */
function signTRA(traXml, certificatePem, privateKeyPem) {
  try {
    const cert = forge.pki.certificateFromPem(certificatePem);
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);

    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(traXml, 'utf8');
    p7.addCertificate(cert);
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date() },
      ],
    });

    p7.sign();

    // Convertir DER → Base64
    const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
    return Buffer.from(der, 'binary').toString('base64');
  } catch (err) {
    throw new ArcaAuthError(`Error al firmar TRA con el certificado del tenant: ${err.message}`);
  }
}

/**
 * Parsea el XML del TA (Ticket de Acceso) devuelto por WSAA.
 * @param {string} xml - XML del TA
 * @returns {{ token: string, sign: string, expirationTime: string|null }}
 */
function parseTA(xml) {
  const tokenMatch = xml.match(/<token>([\s\S]*?)<\/token>/);
  const signMatch = xml.match(/<sign>([\s\S]*?)<\/sign>/);
  const expMatch = xml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/);

  if (!tokenMatch || !signMatch) {
    throw new ArcaAuthError(
      'Respuesta WSAA inválida: no se encontraron campos token/sign en el XML del TA'
    );
  }

  return {
    token: tokenMatch[1].trim(),
    sign: signMatch[1].trim(),
    expirationTime: expMatch ? expMatch[1].trim() : null,
  };
}

/**
 * Obtiene el token y sign de WSAA para un tenant.
 * Mecanismo:
 *  1. Busca en Redis: `arca:wsaa:{tenantId}:{environment}`
 *  2. Si existe, lo devuelve directamente (cache hit)
 *  3. Si no existe: genera TRA, firma, llama WSAA, parsea TA, guarda en cache
 *
 * @param {object} params
 * @param {number} params.tenantId
 * @param {string} params.environment - 'homologacion' | 'produccion'
 * @param {string} params.certificatePem
 * @param {string} params.privateKeyPem
 * @returns {Promise<{ token: string, sign: string, expirationTime: string|null }>}
 */
async function getTokenAndSign({ tenantId, environment, certificatePem, privateKeyPem }) {
  if (!WSAA_WSDL[environment]) {
    throw new ArcaAuthError(`Ambiente ARCA inválido: "${environment}". Usar "homologacion" o "produccion"`);
  }

  const cacheKey = `arca:wsaa:${tenantId}:${environment}`;
  const redis = getRedisClient();

  // 1. Intentar desde cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('WSAA token obtenido desde cache Redis', { tenantId, environment });
        return JSON.parse(cached);
      }
    } catch (cacheErr) {
      // Cache fallback: si Redis falla, continuamos hacia WSAA
      logger.warn('Error leyendo cache WSAA, continuando sin cache', {
        tenantId,
        environment,
        error: cacheErr.message,
      });
    }
  }

  // 2. Generar y firmar TRA
  logger.info('Solicitando nuevo token WSAA a AFIP/ARCA', { tenantId, environment });

  const traXml = buildTRA(WSFE_SERVICE_NAME);
  const signedCms = signTRA(traXml, certificatePem, privateKeyPem);

  // 3. Llamar a WSAA vía SOAP
  let soapClient;
  try {
    soapClient = await soap.createClientAsync(WSAA_WSDL[environment]);
  } catch (err) {
    throw new ArcaAuthError(
      `No se pudo conectar al servicio WSAA de AFIP (${environment}): ${err.message}`
    );
  }

  let wsaaResponse;
  try {
    const [result] = await soapClient.loginCmsAsync({ in0: signedCms });
    wsaaResponse = result?.loginCmsReturn;
  } catch (err) {
    throw new ArcaAuthError(`Error en la llamada SOAP a WSAA: ${err.message}`);
  }

  if (!wsaaResponse) {
    throw new ArcaAuthError('WSAA devolvió una respuesta vacía');
  }

  // 4. Parsear TA
  const tokenData = parseTA(wsaaResponse);

  // 5. Guardar en cache
  if (redis) {
    try {
      await redis.setex(cacheKey, TOKEN_TTL_SECONDS, JSON.stringify(tokenData));
    } catch (cacheErr) {
      logger.warn('No se pudo guardar token WSAA en cache Redis', {
        tenantId,
        environment,
        error: cacheErr.message,
      });
    }
  }

  logger.info('Token WSAA obtenido y cacheado correctamente', { tenantId, environment });
  return tokenData;
}

/**
 * Invalida el token cacheado de un tenant (útil tras actualizar el certificado).
 * @param {number} tenantId
 * @param {string} environment
 */
async function invalidateTokenCache(tenantId, environment) {
  const cacheKey = `arca:wsaa:${tenantId}:${environment}`;
  const redis = getRedisClient();

  if (!redis) return;

  try {
    await redis.del(cacheKey);
    logger.info('Cache WSAA invalidado', { tenantId, environment });
  } catch (err) {
    logger.warn('Error invalidando cache WSAA', { tenantId, environment, error: err.message });
  }
}

/**
 * Verifica que un certificado PEM sea válido y devuelve su fecha de expiración.
 * No lanza si el cert ya venció, solo informa.
 * @param {string} certificatePem
 * @returns {{ isValid: boolean, expiresAt: Date|null, subject: string|null }}
 */
function inspectCertificate(certificatePem) {
  try {
    const cert = forge.pki.certificateFromPem(certificatePem);
    const expiresAt = cert.validity.notAfter;
    const subjectCN = cert.subject.getField('CN')?.value || null;

    return {
      isValid: true,
      expiresAt,
      subject: subjectCN,
    };
  } catch (err) {
    return { isValid: false, expiresAt: null, subject: null };
  }
}

module.exports = {
  getTokenAndSign,
  invalidateTokenCache,
  inspectCertificate,
};
