const { Tenant, Subscription, Admin, Client, Property, Lease, PaymentReceipt } = require('../data');
const { Op } = require('sequelize');
const sequelize = require('../data/models').sequelize;

/**
 * @route GET /api/platform-admin/dashboard
 * @desc Dashboard principal del administrador de plataforma
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getDashboard = async (req, res) => {
  try {
    // Métricas generales
    const totalTenants = await Tenant.count();
    const activeTenants = await Tenant.count({ where: { status: 'active' } });
    const suspendedTenants = await Tenant.count({ where: { status: 'suspended' } });
    
    // Suscripciones activas
    const activeSubscriptions = await Subscription.count({ 
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      } 
    });

    // Distribución por planes
    const planDistribution = await Subscription.findAll({
      where: { status: 'active' },
      attributes: [
        'planId',
        [sequelize.fn('COUNT', sequelize.col('subscriptionId')), 'count']
      ],
      group: ['planId']
    });

    // MRR (Monthly Recurring Revenue) - Suma de precios de planes activos
    const mrrResult = await Subscription.findAll({
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalMRR']
      ]
    });
    const mrr = mrrResult[0]?.dataValues?.totalMRR || 0;

    // ARR (Annual Recurring Revenue)
    const arr = mrr * 12;

    // Churn rate (cancelaciones último mes)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const canceledLastMonth = await Subscription.count({
      where: {
        status: 'canceled',
        updatedAt: { [Op.gte]: lastMonth }
      }
    });

    const totalTenantsLastMonth = await Tenant.count({
      where: {
        createdAt: { [Op.lt]: lastMonth }
      }
    });

    const churnRate = totalTenantsLastMonth > 0 
      ? ((canceledLastMonth / totalTenantsLastMonth) * 100).toFixed(2)
      : 0;

    // Nuevos tenants este mes
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newTenantsThisMonth = await Tenant.count({
      where: {
        createdAt: { [Op.gte]: thisMonth }
      }
    });

    // Trial vs Paid
    const trialTenants = await Subscription.count({
      where: { 
        status: 'trialing',
        endDate: { [Op.gt]: new Date() }
      }
    });

    const paidTenants = activeSubscriptions - trialTenants;

    res.status(200).json({
      success: true,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          suspended: suspendedTenants,
          newThisMonth: newTenantsThisMonth
        },
        subscriptions: {
          active: activeSubscriptions,
          trial: trialTenants,
          paid: paidTenants,
          planDistribution
        },
        revenue: {
          mrr: parseFloat(mrr),
          arr: parseFloat(arr),
          currency: 'ARS'
        },
        metrics: {
          churnRate: parseFloat(churnRate),
          conversionRate: trialTenants > 0 
            ? ((paidTenants / (paidTenants + trialTenants)) * 100).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard',
      error: error.message
    });
  }
};

/**
 * @route GET /api/platform-admin/tenants
 * @desc Lista todos los tenants con sus suscripciones
 * @access Private (PLATFORM_ADMIN only)
 */
exports.listTenants = async (req, res) => {
  try {
    const { status, plan, search, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;

    // Búsqueda por nombre o email
    if (search) {
      where[Op.or] = [
        { businessName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { subdomain: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: tenants, count: total } = await Tenant.findAndCountAll({
      where,
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          required: false,
          where: plan ? { planId: plan } : undefined,
          order: [['createdAt', 'DESC']],
          limit: 1 // Solo la suscripción más reciente
        },
        {
          model: Admin,
          required: false,
          attributes: ['adminId', 'username', 'fullName', 'email', 'role'],
          where: { role: 'SUPER_ADMIN' },
          limit: 1
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        tenants,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error listando tenants:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar tenants',
      error: error.message
    });
  }
};

/**
 * @route GET /api/platform-admin/tenants/:tenantId
 * @desc Detalle completo de un tenant específico
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getTenantDetail = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByPk(tenantId, {
      include: [
        {
          model: Subscription,
          as: 'Subscriptions',
          order: [['createdAt', 'DESC']]
        },
        {
          model: Admin,
          attributes: ['adminId', 'username', 'fullName', 'email', 'role', 'createdAt']
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado'
      });
    }

    // Estadísticas de uso del tenant
    const clientsCount = await Client.count({ where: { tenantId } });
    const propertiesCount = await Property.count({ where: { tenantId } });
    const leasesCount = await Lease.count({ where: { tenantId } });
    const paymentsCount = await PaymentReceipt.count({ where: { tenantId } });

    res.status(200).json({
      success: true,
      data: {
        tenant,
        usage: {
          clients: clientsCount,
          properties: propertiesCount,
          leases: leasesCount,
          payments: paymentsCount
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo detalle de tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de tenant',
      error: error.message
    });
  }
};

/**
 * @route PUT /api/platform-admin/tenants/:tenantId
 * @desc Actualiza información de un tenant
 * @access Private (PLATFORM_ADMIN only)
 */
exports.updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { businessName, email, phone, address, plan, status, maxAgents, maxProperties, features } = req.body;

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado'
      });
    }

    await tenant.update({
      businessName: businessName !== undefined ? businessName : tenant.businessName,
      email: email !== undefined ? email : tenant.email,
      phone: phone !== undefined ? phone : tenant.phone,
      address: address !== undefined ? address : tenant.address,
      plan: plan !== undefined ? plan : tenant.plan,
      status: status !== undefined ? status : tenant.status,
      maxAgents: maxAgents !== undefined ? maxAgents : tenant.maxAgents,
      maxProperties: maxProperties !== undefined ? maxProperties : tenant.maxProperties,
      features: features !== undefined ? features : tenant.features
    });

    res.status(200).json({
      success: true,
      message: 'Tenant actualizado exitosamente',
      data: tenant
    });
  } catch (error) {
    console.error('Error actualizando tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tenant',
      error: error.message
    });
  }
};

/**
 * @route POST /api/platform-admin/tenants/:tenantId/suspend
 * @desc Suspende un tenant
 * @access Private (PLATFORM_ADMIN only)
 */
exports.suspendTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { reason } = req.body;

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado'
      });
    }

    await tenant.update({
      status: 'suspended',
      suspensionReason: reason || 'Suspendido por administrador de plataforma'
    });

    res.status(200).json({
      success: true,
      message: 'Tenant suspendido exitosamente',
      data: tenant
    });
  } catch (error) {
    console.error('Error suspendiendo tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error al suspender tenant',
      error: error.message
    });
  }
};

/**
 * @route POST /api/platform-admin/tenants/:tenantId/activate
 * @desc Reactiva un tenant suspendido
 * @access Private (PLATFORM_ADMIN only)
 */
exports.activateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado'
      });
    }

    await tenant.update({
      status: 'active',
      suspensionReason: null
    });

    res.status(200).json({
      success: true,
      message: 'Tenant reactivado exitosamente',
      data: tenant
    });
  } catch (error) {
    console.error('Error reactivando tenant:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reactivar tenant',
      error: error.message
    });
  }
};

/**
 * @route GET /api/platform-admin/subscriptions
 * @desc Lista todas las suscripciones de la plataforma
 * @access Private (PLATFORM_ADMIN only)
 */
exports.listSubscriptions = async (req, res) => {
  try {
    const { status, planId, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const offset = (page - 1) * limit;

    const { rows: subscriptions, count: total } = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: Tenant,
          attributes: ['tenantId', 'businessName', 'email', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error listando suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar suscripciones',
      error: error.message
    });
  }
};

/**
 * @route GET /api/platform-admin/revenue
 * @desc Métricas de ingresos y análisis financiero
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getRevenue = async (req, res) => {
  try {
    const { period = 'month' } = req.query; // 'month', 'quarter', 'year'

    // Calcular fecha de inicio según período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Ingresos por suscripciones en el período
    const subscriptionRevenue = await Subscription.findAll({
      where: {
        status: 'active',
        startDate: { [Op.gte]: startDate }
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('startDate')), 'month'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('subscriptionId')), 'count']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('startDate'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('startDate')), 'ASC']]
    });

    // Total de ingresos en el período
    const totalRevenue = subscriptionRevenue.reduce(
      (sum, item) => sum + parseFloat(item.dataValues.revenue || 0), 
      0
    );

    // MRR actual
    const currentMRR = await Subscription.sum('amount', {
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      }
    });

    // ARR
    const arr = (currentMRR || 0) * 12;

    // Revenue por plan
    const revenueByPlan = await Subscription.findAll({
      where: { 
        status: 'active',
        endDate: { [Op.gt]: new Date() }
      },
      attributes: [
        'planId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('subscriptionId')), 'count']
      ],
      group: ['planId']
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue: parseFloat(totalRevenue),
        currentMRR: parseFloat(currentMRR || 0),
        arr: parseFloat(arr),
        currency: 'ARS',
        revenueByMonth: subscriptionRevenue,
        revenueByPlan
      }
    });
  } catch (error) {
    console.error('Error obteniendo revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de ingresos',
      error: error.message
    });
  }
};

/**
 * @route GET /api/platform-admin/metrics
 * @desc Métricas avanzadas de la plataforma
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getMetrics = async (req, res) => {
  try {
    // Últimos 30 días
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Growth rate (nuevos tenants)
    const newTenants = await Tenant.count({
      where: { createdAt: { [Op.gte]: last30Days } }
    });

    const previousPeriod = new Date(last30Days);
    previousPeriod.setDate(previousPeriod.getDate() - 30);

    const previousTenants = await Tenant.count({
      where: { 
        createdAt: { 
          [Op.gte]: previousPeriod,
          [Op.lt]: last30Days
        } 
      }
    });

    const growthRate = previousTenants > 0
      ? (((newTenants - previousTenants) / previousTenants) * 100).toFixed(2)
      : 0;

    // Engagement: tenants activos con datos recientes
    const activeTenantsWithData = await Tenant.count({
      where: { status: 'active' },
      include: [
        {
          model: Client,
          as: 'clients',
          required: true,
          where: { createdAt: { [Op.gte]: last30Days } }
        }
      ],
      distinct: true
    });

    const totalActiveTenants = await Tenant.count({ where: { status: 'active' } });
    
    const engagementRate = totalActiveTenants > 0
      ? ((activeTenantsWithData / totalActiveTenants) * 100).toFixed(2)
      : 0;

    // Average subscription value
    const avgSubscriptionValue = await Subscription.findOne({
      where: { status: 'active' },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('amount')), 'avg']
      ]
    });

    // Retention rate (tenants activos después de 90 días)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const tenantsCreated90DaysAgo = await Tenant.count({
      where: {
        createdAt: { [Op.lte]: ninetyDaysAgo }
      }
    });

    const tenantsStillActive = await Tenant.count({
      where: {
        createdAt: { [Op.lte]: ninetyDaysAgo },
        status: 'active'
      }
    });

    const retentionRate = tenantsCreated90DaysAgo > 0
      ? ((tenantsStillActive / tenantsCreated90DaysAgo) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        growthRate: parseFloat(growthRate),
        engagementRate: parseFloat(engagementRate),
        retentionRate: parseFloat(retentionRate),
        avgSubscriptionValue: parseFloat(avgSubscriptionValue?.dataValues?.avg || 0),
        newTenants,
        activeTenantsWithData,
        totalActiveTenants
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas',
      error: error.message
    });
  }
};
