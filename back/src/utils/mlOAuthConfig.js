const logger = require('./logger');

const ML_CALLBACK_PATH = '/api/mercadolibre/callback';

function getPublicBackendUrlForMl() {
  const explicit = (process.env.BACKEND_URL || process.env.API_URL || '').trim();
  if (explicit) {
    return explicit.replace(/\/$/, '').replace(/\/api\/?$/i, '');
  }
  const redirect = process.env.ML_REDIRECT_URI || '';
  const match = redirect.match(/^(https?:\/\/[^/]+)/i);
  if (match) {
    return match[1];
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://inno-prod-api.proudmoss-fef6994b.eastus2.azurecontainerapps.io';
  }
  return 'http://localhost:3001';
}

/**
 * URI de callback OAuth. Debe coincidir EXACTAMENTE con la app en developers.mercadolibre.com.ar
 * Forma correcta: https://tu-api.../api/mercadolibre/callback (incluye /api)
 */
function getMlRedirectUri() {
  const raw = (process.env.ML_REDIRECT_URI || '').trim();
  const canonical = `${getPublicBackendUrlForMl()}${ML_CALLBACK_PATH}`;

  if (!raw) {
    return canonical;
  }

  const normalized = raw.replace(/\/$/, '');

  if (normalized.endsWith(ML_CALLBACK_PATH)) {
    return normalized;
  }

  if (/\/mercadolibre\/callback$/i.test(normalized) && !normalized.includes('/api/mercadolibre/callback')) {
    const fixed = normalized.replace(/\/mercadolibre\/callback$/i, ML_CALLBACK_PATH);
    logger.warn('ML_REDIRECT_URI corregida (faltaba /api)', { configured: raw, using: fixed });
    return fixed;
  }

  return normalized;
}

function getMlOAuthErrorMessage(code) {
  const map = {
    invalid_state: 'La sesión de conexión expiró o no es válida. Intentá de nuevo.',
    no_code: 'No se completó la autorización en Mercado Libre.',
    callback_failed: 'No pudimos guardar la conexión. Revisá que la app de ML tenga la URL de callback correcta.',
    access_denied: 'Cancelaste o no autorizaste el acceso en Mercado Libre.',
    invalid_grant: 'El código de autorización expiró. Conectá de nuevo.',
  };
  return map[code] || `Error al conectar (${code || 'desconocido'}). Revisá la configuración de la app en Mercado Libre.`;
}

module.exports = {
  ML_CALLBACK_PATH,
  getMlRedirectUri,
  getPublicBackendUrlForMl,
  getMlOAuthErrorMessage,
};
