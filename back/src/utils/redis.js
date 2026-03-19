const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

/**
 * Obtener o crear instancia de Redis
 */
function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const defaultRedisEnabled = process.env.NODE_ENV === 'production' ? 'true' : 'false';
  const redisEnabled = (process.env.REDIS_ENABLED ?? defaultRedisEnabled).toLowerCase() !== 'false';
  if (!redisEnabled) {
    logger.info('Redis deshabilitado por configuración (REDIS_ENABLED=false)');
    return null;
  }
  
  const redisUrl = process.env.REDIS_URL || (process.env.NODE_ENV !== 'production' ? 'redis://localhost:6379' : null);

  if (!redisUrl) {
    logger.warn('Redis deshabilitado: REDIS_URL no está configurada');
    return null;
  }
  
  redisClient = new Redis(redisUrl, {
    retryStrategy(times) {
      if (times > 5) {
        const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'warn';
        logger[logLevel]('Redis no disponible: se detienen reintentos automáticos');
        return null;
      }

      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });
  
  redisClient.on('connect', () => {
    logger.info('Redis connected successfully', { url: redisUrl });
  });
  
  redisClient.on('error', (error) => {
    const logLevel = process.env.NODE_ENV === 'production' ? 'error' : 'warn';
    logger[logLevel]('Redis connection error', {
      error: error.message,
      stack: error.stack,
    });
  });
  
  redisClient.on('close', () => {
    logger.warn('Redis connection closed');
  });
  
  redisClient.on('reconnecting', (delay) => {
    logger.info('Redis reconnecting', { delay: `${delay}ms` });
  });
  
  return redisClient;
}

/**
 * Cerrar conexión de Redis (para tests o shutdown)
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

/**
 * Helper: Get con parsing automático de JSON
 */
async function getJson(key) {
  const redis = getRedisClient();
  const value = await redis.get(key);
  
  if (!value) {
    return null;
  }
  
  try {
    return JSON.parse(value);
  } catch (error) {
    logger.warn('Failed to parse Redis JSON', { key, error: error.message });
    return value;
  }
}

/**
 * Helper: Set con stringify automático
 */
async function setJson(key, value, ttlSeconds = null) {
  const redis = getRedisClient();
  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
  
  if (ttlSeconds) {
    return redis.setex(key, ttlSeconds, stringValue);
  }
  
  return redis.set(key, stringValue);
}

/**
 * Helper: Invalidar cache por patrón
 */
async function invalidatePattern(pattern) {
  const redis = getRedisClient();
  
  // SCAN es más eficiente que KEYS en producción
  const keys = [];
  let cursor = '0';
  
  do {
    const [newCursor, foundKeys] = await redis.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      100
    );
    cursor = newCursor;
    keys.push(...foundKeys);
  } while (cursor !== '0');
  
  if (keys.length > 0) {
    await redis.del(...keys);
    logger.debug('Cache invalidated', { pattern, keysDeleted: keys.length });
  }
  
  return keys.length;
}

/**
 * Helper: Incrementar contador con TTL
 */
async function incrementWithTTL(key, ttlSeconds = 60) {
  const redis = getRedisClient();
  
  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, ttlSeconds);
  
  const results = await multi.exec();
  
  // El resultado del INCR es el nuevo valor
  return results[0][1];
}

module.exports = {
  getRedisClient,
  closeRedis,
  getJson,
  setJson,
  invalidatePattern,
  incrementWithTTL,
};
