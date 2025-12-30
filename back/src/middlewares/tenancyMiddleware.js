const { Tenant } = require('../data');

/**
 * Middleware de Tenancy
 * Extrae el tenantId del request (subdomain, header, o contexto)
 * y lo agrega a req.tenantId para usar en todos los controladores
 */
const tenancyMiddleware = async (req, res, next) => {
  try {
    let tenantId = null;
    let tenant = null;

    // OPCIÓN 1: Subdomain (para producción)
    // Ejemplo: demo.tuapp.com → subdomain = "demo"
    const host = req.get('host') || '';
    const subdomain = host.split('.')[0];
    
    if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
      tenant = await Tenant.findOne({ 
        where: { subdomain },
        attributes: ['tenantId', 'businessName', 'status', 'plan', 'features']
      });
      
      if (tenant) {
        tenantId = tenant.tenantId;
      }
    }

    // OPCIÓN 2: Header X-Tenant-Id (para desarrollo/APIs)
    if (!tenantId) {
      const headerTenantId = req.get('X-Tenant-Id');
      if (headerTenantId) {
        tenantId = parseInt(headerTenantId);
        tenant = await Tenant.findByPk(tenantId, {
          attributes: ['tenantId', 'businessName', 'status', 'plan', 'features']
        });
      }
    }

    // OPCIÓN 3: JWT token (si el usuario está logueado)
    if (!tenantId && req.user && req.user.tenantId) {
      tenantId = req.user.tenantId;
      tenant = await Tenant.findByPk(tenantId, {
        attributes: ['tenantId', 'businessName', 'status', 'plan', 'features']
      });
    }

    // OPCIÓN 4: Default para desarrollo (usar tenant demo)
    if (!tenantId) {
      console.warn('⚠️ No tenant detected, using demo tenant (tenantId=1)');
      tenantId = 1;
      tenant = await Tenant.findByPk(1, {
        attributes: ['tenantId', 'businessName', 'status', 'plan', 'features']
      });
    }

    // Verificar que el tenant existe
    if (!tenant) {
      return res.status(404).json({
        error: 'Tenant no encontrado',
        message: 'La inmobiliaria especificada no existe o está deshabilitada'
      });
    }

    // Verificar que el tenant está activo
    if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
      return res.status(403).json({
        error: 'Tenant suspendido',
        message: `La inmobiliaria está en estado: ${tenant.status}`,
        details: 'Contacte con soporte para más información'
      });
    }

    // Agregar tenant al request
    req.tenantId = tenantId;
    req.tenant = tenant;

    console.log(`🏢 Tenant: ${tenant.businessName} (ID: ${tenantId})`);

    next();
  } catch (error) {
    console.error('❌ Error en tenancy middleware:', error);
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
    const { Property } = require('../data');
    const count = await Property.count({ where: { tenantId } });
    
    if (count >= tenant.maxProperties) {
      throw new Error(`Límite de propiedades alcanzado (${tenant.maxProperties}). Actualiza tu plan.`);
    }
  }
  
  if (resourceType === 'agents') {
    const { Admin } = require('../data');
    const count = await Admin.count({ where: { tenantId, role: 'AGENT' } });
    
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
