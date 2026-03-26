const { getTenantBySubdomain, getTenantById, getTenantByCustomDomain } = require('../utils/tenantCache');
const prisma = require('../utils/prismaClient');
const logger = require('../utils/logger');

/**
 * Middleware de Tenancy
 * Extrae el tenantId del request (subdomain, custom domain, header, o contexto)
 * y lo agrega a req.tenantId para usar en todos los controladores
 * 
 * Implementa cache con Redis para mejorar performance
 */
const tenancyMiddleware = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    // OPCIÓN 1: Subdomain o Custom Domain (para producción)
    // Ejemplo: demo.innoinmo.com → subdomain = "demo"
    // O: www.inmobiliaria.com → custom domain
    const host = req.get('host') || '';
    const fullDomain = host.split(':')[0]; // Remover puerto si existe
    
    // Verificar si es un custom domain verificado
    if (!fullDomain.includes('innoinmo.com') && fullDomain !== 'localhost') {
      tenant = await getTenantByCustomDomain(fullDomain);
      
      if (tenant) {
        tenantId = tenant.tenantId;
        logger.debug('Tenant resolved by custom domain', { domain: fullDomain, tenantId });
      }
    }
    
    // Si no es custom domain, intentar subdomain
    if (!tenant) {
      const subdomain = fullDomain.split('.')[0];
      
      if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
        tenant = await getTenantBySubdomain(subdomain);
        
        if (tenant) {
          tenantId = tenant.tenantId;
          logger.debug('Tenant resolved by subdomain', { subdomain, tenantId });
        }
      }
    }

    // OPCIÓN 2: Header X-Tenant-Id (para desarrollo/APIs)
    if (!tenantId) {
      const headerTenantId = req.get('X-Tenant-Id');
      if (headerTenantId) {
        tenantId = parseInt(headerTenantId);
        tenant = await getTenantById(tenantId);
        
        if (tenant) {
          logger.debug('Tenant resolved by header', { tenantId });
        }
      }
    }

    // OPCIÓN 3: JWT token (si el usuario está logueado)
    if (!tenantId && req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
      tenant = await getTenantById(tenantId);
      
      if (tenant) {
        logger.debug('Tenant resolved by JWT', { tenantId });
      }
    }

    // OPCIÓN 4: Default para desarrollo (usar tenant demo)
    if (!tenantId && process.env.NODE_ENV === 'development') {
      logger.warn('No tenant detected, using demo tenant (tenantId=1)', {
        host,
        url: req.originalUrl,
      });
      tenantId = 1;
      tenant = await getTenantById(1);
    }

    // Verificar que el tenant existe
    if (!tenant) {
      logger.warn('Tenant not found', {
        host,
        subdomain: fullDomain.split('.')[0],
        url: req.originalUrl,
      });
      
      return res.status(404).json({
        error: 'Tenant no encontrado',
        message: 'La inmobiliaria especificada no existe o está deshabilitada'
      });
    }

    // Verificar que el tenant está activo
    if (tenant.status !== 'active' && tenant.status !== 'trialing') {
      logger.warn('Tenant not active', {
        tenantId,
        status: tenant.status,
      });
      
      return res.status(403).json({
        error: 'Tenant suspendido',
        message: `La inmobiliaria está en estado: ${tenant.status}`,
        details: 'Contacte con soporte para más información'
      });
    }

    // Agregar tenant al request
    req.tenantId = tenantId;
    req.tenant = tenant;

    logger.debug('Tenant context set', {
      tenantId,
      businessName: tenant.businessName,
      plan: tenant.plan,
    });

    next();
  } catch (error) {
    logger.error('Error in tenancy middleware', {
      error: error.message,
      stack: error.stack,
      host: req.get('host'),
      url: req.originalUrl,
    });
    
    return res.status(500).json({
      error: 'Error de tenancy',
      message: error.message
    });
  }
};

/**
 * Middleware para verificar que el tenant tiene un feature habilitado
 * Uso: router.get('/whatsapp', requireFeature('whatsapp'), controller)
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return res.status(403).json({
        error: 'Tenant no detectado',
        message: 'No se pudo identificar la inmobiliaria'
      });
    }

    const hasFeature = req.tenant.features && req.tenant.features[featureName];
    
    if (!hasFeature) {
      return res.status(403).json({
        error: 'Feature no disponible',
        message: `La funcionalidad "${featureName}" no está habilitada para tu plan`,
        details: `Actualiza tu plan para acceder a esta funcionalidad`
      });
    }

    next();
  };
};

/**
 * Helper para agregar tenantId automáticamente a las queries
 * Uso: const whereClause = addTenantFilter(req, { status: 'active' });
 */
const addTenantFilter = (req, whereConditions = {}) => {
  return {
    ...whereConditions,
    tenantId: req.tenantId
  };
};

/**
 * Verificar límites del plan
 */
const checkPlanLimits = async (req, resourceType) => {
  const { tenant, tenantId } = req;
  
  if (resourceType === 'properties') {
    const count = await prisma.Property.count({ where: { tenantId } });
    if (count >= tenant.maxProperties) {
      throw new Error(`Límite de propiedades alcanzado (${tenant.maxProperties}). Actualiza tu plan.`);
    }
  }

  if (resourceType === 'agents') {
    const count = await prisma.admins.count({ where: { tenantId, role: 'AGENT' } });
    if (count >= tenant.maxAgents) {
      throw new Error(`Límite de agentes alcanzado (${tenant.maxAgents}). Actualiza tu plan.`);
    }
  }

  return true;
};

module.exports = {
  tenancyMiddleware,
  requireFeature,
  addTenantFilter,
  checkPlanLimits
};
