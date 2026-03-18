const { getJson, setJson, invalidatePattern } = require('./redis');
const logger = require('./logger');
const prisma = require('./prismaClient');

const CACHE_TTL = 900; // 15 minutos

const TENANT_SELECT = {
  tenantId: true, businessName: true, subdomain: true,
  status: true, plan: true, features: true,
};

/**
 * Obtener tenant por subdomain con cache
 */
async function getTenantBySubdomain(subdomain) {
  const cacheKey = `tenant:subdomain:${subdomain}`;

  try {
    const cached = await getJson(cacheKey);
    if (cached) {
      logger.debug('Tenant cache hit', { subdomain, cacheKey });
      return cached;
    }

    logger.debug('Tenant cache miss', { subdomain, cacheKey });

    const tenant = await prisma.tenants.findFirst({
      where: { subdomain },
      select: TENANT_SELECT,
    });

    if (tenant) {
      await setJson(cacheKey, tenant, CACHE_TTL);
      logger.debug('Tenant cached', { subdomain, tenantId: tenant.tenantId });
    }

    return tenant;
  } catch (error) {
    logger.error('Error getting tenant from cache', {
      subdomain,
      error: error.message,
      stack: error.stack,
    });
    return prisma.tenants.findFirst({
      where: { subdomain },
      select: TENANT_SELECT,
    });
  }
}

/**
 * Obtener tenant por ID con cache
 */
async function getTenantById(tenantId) {
  const cacheKey = `tenant:id:${tenantId}`;

  try {
    const cached = await getJson(cacheKey);
    if (cached) {
      logger.debug('Tenant cache hit', { tenantId, cacheKey });
      return cached;
    }

    const tenant = await prisma.tenants.findUnique({
      where: { tenantId },
      select: TENANT_SELECT,
    });

    if (tenant) {
      await setJson(cacheKey, tenant, CACHE_TTL);
      logger.debug('Tenant cached', { tenantId });
    }

    return tenant;
  } catch (error) {
    logger.error('Error getting tenant by ID from cache', {
      tenantId,
      error: error.message,
    });
    return prisma.tenants.findUnique({ where: { tenantId } });
  }
}

/**
 * Obtener tenant por dominio personalizado con cache
 */
async function getTenantByCustomDomain(_domain) {
  // tenants no tiene custom_domain en el schema actual
  return null;
}

/**
 * Invalidar cache de un tenant (llamar al actualizar/eliminar)
 */
async function invalidateTenantCache(tenantId, subdomain = null, customDomain = null) {
  try {
    const keys = [`tenant:id:${tenantId}`];
    
    if (subdomain) {
      keys.push(`tenant:subdomain:${subdomain}`);
    }
    
    if (customDomain) {
      keys.push(`tenant:domain:${customDomain}`);
    }
    
    // También invalidar por patrón por si acaso
    await invalidatePattern(`tenant:*:${tenantId}*`);
    
    logger.info('Tenant cache invalidated', { tenantId, subdomain, customDomain, keys });
  } catch (error) {
    logger.error('Error invalidating tenant cache', {
      tenantId,
      error: error.message,
    });
  }
}

/**
 * Caché genérico por tenant (ej: propiedades, clientes)
 */
async function getCachedData(cacheKey, fetchFn, ttl = 300) {
  try {
    const cached = await getJson(cacheKey);
    if (cached) {
      logger.debug('Cache hit', { cacheKey });
      return cached;
    }
    
    logger.debug('Cache miss', { cacheKey });
    
    const data = await fetchFn();
    
    if (data) {
      await setJson(cacheKey, data, ttl);
      logger.debug('Data cached', { cacheKey, ttl });
    }
    
    return data;
  } catch (error) {
    logger.error('Error in cached data fetch', {
      cacheKey,
      error: error.message,
    });
    
    // Fallback: ejecutar función sin cache
    return fetchFn();
  }
}
  
module.exports = {
  getTenantBySubdomain,
  getTenantById,
  getTenantByCustomDomain,
  invalidateTenantCache,
  getCachedData,
};