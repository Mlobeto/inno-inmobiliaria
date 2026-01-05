const { Plan } = require('../data');

/**
 * Controlador de Planes
 * Gestión de planes de suscripción (solo PLATFORM_ADMIN)
 */

// Listar todos los planes
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.findAll({
      order: [['sortOrder', 'ASC'], ['priceMonthly', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    console.error('❌ Error al obtener planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener planes',
      error: error.message
    });
  }
};

// Obtener un plan por ID
exports.getPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('❌ Error al obtener plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plan',
      error: error.message
    });
  }
};

// Crear un nuevo plan
exports.createPlan = async (req, res) => {
  try {
    const {
      planId,
      name,
      description,
      priceMonthly,
      priceYearly,
      currency,
      mpPlanId,
      stripePriceId,
      features,
      trialDays,
      isActive,
      isPopular,
      sortOrder
    } = req.body;

    // Validaciones básicas
    if (!planId || !name || !priceMonthly) {
      return res.status(400).json({
        success: false,
        message: 'planId, name y priceMonthly son requeridos'
      });
    }

    // Verificar que el planId no exista
    const existingPlan = await Plan.findByPk(planId);
    if (existingPlan) {
      return res.status(409).json({
        success: false,
        message: 'El planId ya existe'
      });
    }

    const newPlan = await Plan.create({
      planId,
      name,
      description,
      priceMonthly,
      priceYearly,
      currency: currency || 'ARS',
      mpPlanId,
      stripePriceId,
      features: features || {},
      trialDays: trialDays || 14,
      isActive: isActive !== undefined ? isActive : true,
      isPopular: isPopular || false,
      sortOrder: sortOrder || 0
    });

    console.log('✅ Plan creado:', newPlan.planId);

    res.status(201).json({
      success: true,
      message: 'Plan creado exitosamente',
      plan: newPlan
    });
  } catch (error) {
    console.error('❌ Error al crear plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear plan',
      error: error.message
    });
  }
};

// Actualizar un plan
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    const plan = await Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // No permitir cambiar el planId
    delete updates.planId;

    await plan.update(updates);

    console.log('✅ Plan actualizado:', planId);

    res.status(200).json({
      success: true,
      message: 'Plan actualizado exitosamente',
      plan
    });
  } catch (error) {
    console.error('❌ Error al actualizar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar plan',
      error: error.message
    });
  }
};

// Eliminar un plan (soft delete - marcarlo como inactivo)
exports.deletePlan = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Verificar si hay suscripciones activas con este plan
    const { Subscription } = require('../data');
    const activeSubscriptions = await Subscription.count({
      where: {
        planId,
        status: ['active', 'trialing']
      }
    });

    if (activeSubscriptions > 0) {
      // Solo marcar como inactivo si hay suscripciones activas
      await plan.update({ isActive: false });
      
      return res.status(200).json({
        success: true,
        message: `Plan marcado como inactivo. Hay ${activeSubscriptions} suscripciones activas usando este plan.`,
        plan
      });
    }

    // Si no hay suscripciones activas, permitir eliminación completa
    await plan.destroy();

    console.log('✅ Plan eliminado:', planId);

    res.status(200).json({
      success: true,
      message: 'Plan eliminado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al eliminar plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar plan',
      error: error.message
    });
  }
};

// Activar/desactivar un plan
exports.togglePlanStatus = async (req, res) => {
  try {
    const { planId } = req.params;

    const plan = await Plan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    await plan.update({ isActive: !plan.isActive });

    console.log(`✅ Plan ${plan.isActive ? 'activado' : 'desactivado'}:`, planId);

    res.status(200).json({
      success: true,
      message: `Plan ${plan.isActive ? 'activado' : 'desactivado'} exitosamente`,
      plan
    });
  } catch (error) {
    console.error('❌ Error al cambiar estado del plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del plan',
      error: error.message
    });
  }
};
