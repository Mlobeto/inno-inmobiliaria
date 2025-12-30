const { Subscription, Plan } = require('../data');

/**
 * Middleware para verificar que el tenant tenga una suscripción activa
 */
async function checkSubscription(req, res, next) {
  try {
    const { tenantId } = req.user;
    
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: 'No se pudo verificar el tenant'
      });
    }
    
    // Buscar suscripción activa o en trial
    const subscription = await Subscription.findOne({
      where: {
        tenantId,
        status: ['trialing', 'active']
      },
      include: [{
        model: Plan,
        as: 'Plan'
      }]
    });
    
    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'No tienes una suscripción activa',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }
    
    // Verificar si expiró
    const now = new Date();
    if (subscription.currentPeriodEnd && now > subscription.currentPeriodEnd) {
      await subscription.update({ status: 'past_due' });
      return res.status(403).json({
        success: false,
        error: 'Tu suscripción ha expirado',
        code: 'SUBSCRIPTION_EXPIRED'
      });
    }
    
    // Agregar suscripción al request para uso posterior
    req.subscription = subscription;
    req.plan = subscription.Plan;
    
    next();
  } catch (error) {
    console.error('Error verificando suscripción:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar la suscripción'
    });
  }
}

/**
 * Middleware para verificar que el plan incluya una característica específica
 * Uso: checkFeature('whatsappIntegration')
 */
function checkFeature(featureName) {
  return async (req, res, next) => {
    try {
      // Si no hay subscription en el request, verificarla primero
      if (!req.subscription) {
        await checkSubscription(req, res, () => {});
        if (!req.subscription) return; // checkSubscription ya envió la respuesta
      }
      
      const features = req.plan.features || {};
      
      if (!features[featureName]) {
        return res.status(403).json({
          success: false,
          error: `Tu plan no incluye la característica: ${featureName}`,
          code: 'FEATURE_NOT_AVAILABLE',
          feature: featureName,
          currentPlan: req.plan.name
        });
      }
      
      next();
    } catch (error) {
      console.error('Error verificando característica:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar la característica'
      });
    }
  };
}

/**
 * Middleware para verificar límites del plan
 * Uso: checkLimit('maxProperties', currentCount)
 */
function checkLimit(limitName) {
  return async (req, res, next) => {
    try {
      // Si no hay subscription en el request, verificarla primero
      if (!req.subscription) {
        await checkSubscription(req, res, () => {});
        if (!req.subscription) return;
      }
      
      const features = req.plan.features || {};
      const limit = features[limitName];
      
      // Si el límite no existe o es null, permitir (ilimitado)
      if (limit === null || limit === undefined) {
        return next();
      }
      
      // El currentCount debe ser provisto por el controller
      // Se debe pasar en req.body.currentCount o calcularse antes
      const currentCount = req.currentCount || 0;
      
      if (currentCount >= limit) {
        return res.status(403).json({
          success: false,
          error: `Has alcanzado el límite de tu plan: ${limit} ${limitName}`,
          code: 'LIMIT_REACHED',
          limit: limit,
          current: currentCount,
          limitName: limitName,
          currentPlan: req.plan.name
        });
      }
      
      next();
    } catch (error) {
      console.error('Error verificando límite:', error);
      res.status(500).json({
        success: false,
        error: 'Error al verificar el límite'
      });
    }
  };
}

/**
 * Middleware opcional: permitir acceso sin suscripción pero agregar info al request
 */
async function optionalSubscription(req, res, next) {
  try {
    const { tenantId } = req.user;
    
    if (tenantId) {
      const subscription = await Subscription.findOne({
        where: {
          tenantId,
          status: ['trialing', 'active']
        },
        include: [{
          model: Plan,
          as: 'Plan'
        }]
      });
      
      if (subscription) {
        req.subscription = subscription;
        req.plan = subscription.Plan;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error en optionalSubscription:', error);
    next(); // Continuar aunque haya error
  }
}

module.exports = {
  checkSubscription,
  checkFeature,
  checkLimit,
  optionalSubscription
};
