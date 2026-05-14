const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../utils/redis');
const logger = require('../utils/logger');

const redisClient = getRedisClient();

/** Límite de login / auth: intentos fallidos por IP por ventana (skipSuccessfulRequests: true). */
const AUTH_RATE_LIMIT_MAX = Math.min(
  500,
  Math.max(1, parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10) || 5)
);
const AUTH_RATE_LIMIT_WINDOW_MS = Math.max(
  60_000,
  (parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES || '15', 10) || 15) * 60 * 1000
);

function buildStore(prefix) {
  if (!redisClient) {
    logger.warn('Rate limiter usando memoria local (Redis no disponible)', { prefix });
    return undefined;
  }

  if (redisClient.status !== 'ready') {
    logger.warn('Rate limiter usando memoria local (Redis no listo)', {
      prefix,
      status: redisClient.status,
    });
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix,
  });
}

/**
 * Rate limiter global (por IP)
 * Previene abuso general del API
 */
const globalLimiter = rateLimit({
  store: buildStore('rl:global:'),
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por IP cada 15 minutos
  message: {
    error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Log cuando se alcanza el límite
  handler: (req, res) => {
    logger.warn('Rate limit exceeded - Global', {
      ip: req.ip,
      url: req.originalUrl,
      userAgent: req.get('user-agent'),
    });
    
    res.status(429).json({
      error: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en 15 minutos.',
      retryAfter: '15 minutos',
    });
  },
});

/**
 * Rate limiter por tenant
 * Límites dinámicos según el plan del tenant
 */
const tenantLimiter = rateLimit({
  store: buildStore('rl:tenant:'),
  windowMs: 15 * 60 * 1000, // 15 minutos
  
  // Límites dinámicos según plan
  max: async (req) => {
    const planLimits = {
      FREE: 100,
      BASIC: 500,
      PROFESSIONAL: 2000,
      ENTERPRISE: 10000,
    };
    
    const tenantPlan = (req.tenant?.plan || 'FREE').toUpperCase();
    const limit = planLimits[tenantPlan] ?? 500; // fallback 500 si el plan no está mapeado
    
    logger.debug('Tenant rate limit check', {
      tenantId: req.tenantId,
      plan: tenantPlan,
      limit,
    });
    
    return limit;
  },
  
  // Identificador único por tenant
  keyGenerator: (req) => {
    return req.tenantId ? `tenant:${req.tenantId}` : 'unknown';
  },
  
  // Skip si no hay tenant (ej: rutas públicas)
  skip: (req) => !req.tenantId,
  
  message: {
    error: 'Has excedido el límite de solicitudes de tu plan. Actualiza tu plan para más capacidad.',
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn('Rate limit exceeded - Tenant', {
      tenantId: req.tenantId,
      plan: req.tenant?.plan,
      ip: req.ip,
      url: req.originalUrl,
    });
    
    res.status(429).json({
      error: 'Has excedido el límite de solicitudes de tu plan.',
      plan: req.tenant?.plan,
      message: 'Actualiza tu plan en la configuración para incrementar tu límite de requests.',
    });
  },
});

/**
 * Rate limiter estricto para endpoints sensibles
 * (Login, registro, recuperación de contraseña)
 */
const authRetryAfterLabel =
  AUTH_RATE_LIMIT_WINDOW_MS >= 60_000
    ? `${Math.round(AUTH_RATE_LIMIT_WINDOW_MS / 60000)} minutos`
    : `${Math.round(AUTH_RATE_LIMIT_WINDOW_MS / 1000)} segundos`;

const authLimiter = rateLimit({
  store: buildStore('rl:auth:'),
  windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  skipSuccessfulRequests: true, // No contar requests exitosos

  message: {
    error: `Demasiados intentos de inicio de sesión. Intenta de nuevo en ${authRetryAfterLabel}.`,
    retryAfter: authRetryAfterLabel,
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    logger.warn('Rate limit exceeded - Auth', {
      ip: req.ip,
      url: req.originalUrl,
      email: req.body?.email,
      max: AUTH_RATE_LIMIT_MAX,
      windowMs: AUTH_RATE_LIMIT_WINDOW_MS,
    });

    res.status(429).json({
      error: `Demasiados intentos de inicio de sesión. Intenta de nuevo en ${authRetryAfterLabel}.`,
      retryAfter: authRetryAfterLabel,
    });
  },
});

/**
 * Rate limiter para endpoints de integración (webhooks, etc.)
 */
const webhookLimiter = rateLimit({
  store: buildStore('rl:webhook:'),
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por minuto
  
  keyGenerator: (req) => {
    // Identificar por tenant y provider
    const provider = req.params.provider || 'unknown';
    return `${req.tenantId}:${provider}`;
  },
  
  skip: (req) => !req.tenantId,
  
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn('Rate limit exceeded - Webhook', {
      tenantId: req.tenantId,
      provider: req.params.provider,
      ip: req.ip,
    });
    
    res.status(429).json({
      error: 'Demasiados webhooks recibidos. Intenta de nuevo en un minuto.',
    });
  },
});

/**
 * Rate limiter para uploads (más estricto)
 */
const uploadLimiter = rateLimit({
  store: buildStore('rl:upload:'),
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 uploads por minuto
  
  keyGenerator: (req) => `tenant:${req.tenantId}`,
  skip: (req) => !req.tenantId,
  
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn('Rate limit exceeded - Upload', {
      tenantId: req.tenantId,
      ip: req.ip,
    });
    
    res.status(429).json({
      error: 'Demasiados uploads. Espera un minuto antes de subir más archivos.',
    });
  },
});

module.exports = {
  globalLimiter,
  tenantLimiter,
  authLimiter,
  webhookLimiter,
  uploadLimiter,
};
