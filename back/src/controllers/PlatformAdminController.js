const prisma = require('../utils/prismaClient');
const { invalidateTenantCache } = require('../utils/tenantCache');
const {
  isLifetimeSubscription,
  normalizePlanId,
  syncTenantSubscriptionPlan,
} = require('../utils/subscriptionHelpers');
const logger = require('../utils/logger');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../emailService');

/**
 * @route GET /api/platform-admin/dashboard
 * @desc Dashboard principal del administrador de plataforma
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      activeSubscriptions,
      planDistributionRaw,
      mrrAggregate,
    ] = await Promise.all([
      prisma.tenants.count(),
      prisma.tenants.count({ where: { status: 'active' } }),
      prisma.tenants.count({ where: { status: 'suspended' } }),
      prisma.subscriptions.count({
        where: {
          status: 'active',
          currentPeriodEnd: { gt: now },
        },
      }),
      prisma.subscriptions.groupBy({
        by: ['planId'],
        where: { status: 'active' },
        _count: { subscriptionId: true },
      }),
      prisma.subscriptions.aggregate({
        where: {
          status: 'active',
          currentPeriodEnd: { gt: now },
        },
        _sum: { amount: true },
      }),
    ]);

    const mrr = Number(mrrAggregate._sum.amount || 0);
    const arr = mrr * 12;

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [canceledLastMonth, totalTenantsLastMonth] = await Promise.all([
      prisma.subscriptions.count({
        where: {
          status: 'canceled',
          updatedAt: { gte: lastMonth },
        },
      }),
      prisma.tenants.count({
        where: {
          createdAt: { lt: lastMonth },
        },
      }),
    ]);

    const churnRate = totalTenantsLastMonth > 0
      ? ((canceledLastMonth / totalTenantsLastMonth) * 100).toFixed(2)
      : 0;

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const [newTenantsThisMonth, trialTenants] = await Promise.all([
      prisma.tenants.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.subscriptions.count({
        where: {
          status: 'trialing',
          currentPeriodEnd: { gt: now },
        },
      }),
    ]);

    const paidTenants = activeSubscriptions - trialTenants;

    const planDistribution = planDistributionRaw.map((item) => ({
      planId: item.planId,
      count: item._count.subscriptionId,
    }));

    res.status(200).json({
      success: true,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          suspended: suspendedTenants,
          newThisMonth: newTenantsThisMonth,
        },
        subscriptions: {
          active: activeSubscriptions,
          trial: trialTenants,
          paid: paidTenants,
          planDistribution,
        },
        revenue: {
          mrr,
          arr,
          currency: 'ARS',
        },
        metrics: {
          churnRate: parseFloat(churnRate),
          conversionRate: trialTenants > 0
            ? parseFloat(((paidTenants / (paidTenants + trialTenants)) * 100).toFixed(2))
            : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Error obteniendo dashboard', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard',
      error: error.message,
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

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subdomain: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [tenants, total] = await Promise.all([
      prisma.tenants.findMany({
        where,
        include: {
          subscriptions: {
            where: plan ? { planId: plan } : undefined,
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          admins: {
            where: { role: 'SUPER_ADMIN' },
            select: {
              adminId: true,
              username: true,
              fullName: true,
              email: true,
              role: true,
            },
            take: 1,
          },
        },
        take: limitNumber,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tenants.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tenants,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    logger.error('Error listando tenants', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al listar tenants',
      error: error.message,
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
    const tenantId = parseInt(req.params.tenantId, 10);

    const tenant = await prisma.tenants.findUnique({
      where: { tenantId },
      include: {
        subscriptions: { orderBy: { createdAt: 'desc' } },
        admins: {
          select: {
            adminId: true,
            username: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado',
      });
    }

    const [clientsCount, propertiesCount, leasesCount, paymentsCount] = await Promise.all([
      prisma.Clients.count({ where: { tenantId } }),
      prisma.Property.count({ where: { tenantId } }),
      prisma.Leases.count({ where: { tenantId } }),
      prisma.PaymentReceipts.count({ where: { tenantId } }),
    ]);

    const latestSubscription = tenant.subscriptions?.[0] || null;

    res.status(200).json({
      success: true,
      data: {
        tenant,
        subscription: latestSubscription,
        usage: {
          clients: clientsCount,
          properties: propertiesCount,
          leases: leasesCount,
          payments: paymentsCount,
        },
      },
    });
  } catch (error) {
    logger.error('Error obteniendo detalle de tenant', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de tenant',
      error: error.message,
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
    const tenantId = parseInt(req.params.tenantId, 10);
    const { businessName, email, phone, address, plan, status, maxAgents, maxProperties, features, subdomain } = req.body;

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado',
      });
    }

    // Validar y verificar unicidad del subdomain si se quiere cambiar
    if (subdomain !== undefined && subdomain !== tenant.subdomain) {
      const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
      if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'El subdominio debe contener solo letras minúsculas, números y guiones (3-50 caracteres)',
        });
      }
      const existing = await prisma.tenants.findFirst({
        where: { subdomain, tenantId: { not: tenantId } },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Este subdominio ya está en uso por otro tenant',
        });
      }
    }

    // Si se cambió el plan, sincronizar features/límites desde la BD de planes
    let resolvedFeatures = features !== undefined ? features : tenant.features;
    let resolvedMaxAgents = maxAgents !== undefined ? maxAgents : tenant.maxAgents;
    let resolvedMaxProperties = maxProperties !== undefined ? maxProperties : tenant.maxProperties;

    let planRecord = null;
    const planChanged = plan !== undefined && normalizePlanId(plan) !== normalizePlanId(tenant.plan);

    if (plan !== undefined) {
      planRecord = await prisma.plans.findFirst({
        where: { planId: normalizePlanId(plan), isActive: true },
      });
      if (planRecord) {
        resolvedFeatures = planRecord.features ?? resolvedFeatures;
        resolvedMaxAgents = planRecord.maxUsers ?? resolvedMaxAgents;
        resolvedMaxProperties = planRecord.maxProperties ?? resolvedMaxProperties;
      }
    }

    const updated = await prisma.tenants.update({
      where: { tenantId },
      data: {
        businessName: businessName !== undefined ? businessName : tenant.businessName,
        email: email !== undefined ? email : tenant.email,
        phone: phone !== undefined ? phone : tenant.phone,
        address: address !== undefined ? address : tenant.address,
        plan: plan !== undefined ? plan : tenant.plan,
        status: status !== undefined ? status : tenant.status,
        maxAgents: resolvedMaxAgents,
        maxProperties: resolvedMaxProperties,
        features: resolvedFeatures,
        subdomain: subdomain !== undefined ? subdomain : tenant.subdomain,
      },
    });

    if (planChanged && plan !== undefined) {
      await syncTenantSubscriptionPlan(prisma, tenantId, plan, planRecord);
    }

    // Invalidar caché del subdomain viejo Y del nuevo si cambió
    await invalidateTenantCache(tenant.tenantId, tenant.subdomain, null);
    if (subdomain !== undefined && subdomain !== tenant.subdomain) {
      await invalidateTenantCache(tenant.tenantId, subdomain, null);
    }

    const latestSubscription = await prisma.subscriptions.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      message: 'Tenant actualizado exitosamente',
      data: updated,
      subscription: latestSubscription,
    });
  } catch (error) {
    logger.error('Error actualizando tenant', { tenantId: req.params.tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al actualizar tenant',
      error: error.message,
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
    const tenantId = parseInt(req.params.tenantId, 10);

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado',
      });
    }

    const updated = await prisma.tenants.update({
      where: { tenantId },
      data: { status: 'suspended' },
    });

    await invalidateTenantCache(tenant.tenantId, tenant.subdomain, null);

    res.status(200).json({
      success: true,
      message: 'Tenant suspendido exitosamente',
      data: updated,
    });
  } catch (error) {
    logger.error('Error suspendiendo tenant', { tenantId: req.params.tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al suspender tenant',
      error: error.message,
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
    const tenantId = parseInt(req.params.tenantId, 10);

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado',
      });
    }

    const updated = await prisma.tenants.update({
      where: { tenantId },
      data: { status: 'active' },
    });

    await invalidateTenantCache(tenant.tenantId, tenant.subdomain, null);

    res.status(200).json({
      success: true,
      message: 'Tenant reactivado exitosamente',
      data: updated,
    });
  } catch (error) {
    logger.error('Error reactivando tenant', { tenantId: req.params.tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al reactivar tenant',
      error: error.message,
    });
  }
};

/**
 * @route DELETE /api/platform-admin/tenants/:tenantId
 * @desc Elimina un tenant permanentemente
 * @access Private (PLATFORM_ADMIN only)
 */
exports.deleteTenant = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado',
      });
    }

    await prisma.tenants.delete({ where: { tenantId } });

    res.status(200).json({
      success: true,
      message: 'Tenant eliminado exitosamente',
    });
  } catch (error) {
    logger.error('Error eliminando tenant', { tenantId: req.params.tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al eliminar tenant',
      error: error.message,
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

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;

    const [subscriptions, total] = await Promise.all([
      prisma.subscriptions.findMany({
        where,
        include: {
          tenants: {
            select: {
              tenantId: true,
              businessName: true,
              email: true,
              status: true,
            },
          },
        },
        take: limitNumber,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.subscriptions.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        subscriptions,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages: Math.ceil(total / limitNumber),
        },
      },
    });
  } catch (error) {
    logger.error('Error listando suscripciones', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al listar suscripciones',
      error: error.message,
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
    const { period = 'month' } = req.query;

    const now = new Date();
    const startDate = new Date();

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
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const periodSubscriptions = await prisma.subscriptions.findMany({
      where: {
        status: 'active',
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        amount: true,
        planId: true,
        subscriptionId: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const revenueByMonthMap = new Map();
    for (const sub of periodSubscriptions) {
      const key = `${sub.createdAt.getFullYear()}-${String(sub.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const current = revenueByMonthMap.get(key) || { month: key, revenue: 0, count: 0 };
      current.revenue += Number(sub.amount || 0);
      current.count += 1;
      revenueByMonthMap.set(key, current);
    }
    const revenueByMonth = Array.from(revenueByMonthMap.values());

    const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.revenue, 0);

    const [currentMRRAggregate, revenueByPlanRaw] = await Promise.all([
      prisma.subscriptions.aggregate({
        where: {
          status: 'active',
          currentPeriodEnd: { gt: now },
        },
        _sum: { amount: true },
      }),
      prisma.subscriptions.groupBy({
        by: ['planId'],
        where: {
          status: 'active',
          currentPeriodEnd: { gt: now },
        },
        _sum: { amount: true },
        _count: { subscriptionId: true },
      }),
    ]);

    const currentMRR = Number(currentMRRAggregate._sum.amount || 0);
    const arr = currentMRR * 12;

    const revenueByPlan = revenueByPlanRaw.map((item) => ({
      planId: item.planId,
      revenue: Number(item._sum.amount || 0),
      count: item._count.subscriptionId,
    }));

    res.status(200).json({
      success: true,
      data: {
        period,
        totalRevenue,
        currentMRR,
        arr,
        currency: 'ARS',
        revenueByMonth,
        revenueByPlan,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo revenue', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas de ingresos',
      error: error.message,
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
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const newTenants = await prisma.tenants.count({
      where: { createdAt: { gte: last30Days } },
    });

    const previousPeriod = new Date(last30Days);
    previousPeriod.setDate(previousPeriod.getDate() - 30);

    const previousTenants = await prisma.tenants.count({
      where: {
        createdAt: {
          gte: previousPeriod,
          lt: last30Days,
        },
      },
    });

    const growthRate = previousTenants > 0
      ? (((newTenants - previousTenants) / previousTenants) * 100).toFixed(2)
      : 0;

    const activeTenantsWithClientActivity = await prisma.Clients.findMany({
      where: { createdAt: { gte: last30Days } },
      distinct: ['tenantId'],
      select: { tenantId: true },
    });

    const activeTenantIdsWithData = activeTenantsWithClientActivity
      .map((item) => item.tenantId)
      .filter((tenantId) => tenantId !== null && tenantId !== undefined);

    const [activeTenantsWithData, totalActiveTenants] = await Promise.all([
      prisma.tenants.count({
        where: {
          status: 'active',
          tenantId: { in: activeTenantIdsWithData.length ? activeTenantIdsWithData : [-1] },
        },
      }),
      prisma.tenants.count({ where: { status: 'active' } }),
    ]);

    const engagementRate = totalActiveTenants > 0
      ? ((activeTenantsWithData / totalActiveTenants) * 100).toFixed(2)
      : 0;

    const avgSubscriptionValueAggregate = await prisma.subscriptions.aggregate({
      where: { status: 'active' },
      _avg: { amount: true },
    });

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const [tenantsCreated90DaysAgo, tenantsStillActive] = await Promise.all([
      prisma.tenants.count({ where: { createdAt: { lte: ninetyDaysAgo } } }),
      prisma.tenants.count({
        where: {
          createdAt: { lte: ninetyDaysAgo },
          status: 'active',
        },
      }),
    ]);

    const retentionRate = tenantsCreated90DaysAgo > 0
      ? ((tenantsStillActive / tenantsCreated90DaysAgo) * 100).toFixed(2)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        growthRate: parseFloat(growthRate),
        engagementRate: parseFloat(engagementRate),
        retentionRate: parseFloat(retentionRate),
        avgSubscriptionValue: Number(avgSubscriptionValueAggregate._avg.amount || 0),
        newTenants,
        activeTenantsWithData,
        totalActiveTenants,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo métricas', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al obtener métricas',
      error: error.message,
    });
  }
};

/**
 * @route GET /api/platform-admin/tenants/check-subdomain/:subdomain
 * @desc Verificar si un subdomain está disponible
 * @access Private (PLATFORM_ADMIN only)
 */
exports.checkSubdomainAvailability = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Subdomain inválido. Solo letras minúsculas, números y guiones (no al inicio/fin).',
      });
    }

    const existingTenant = await prisma.tenants.findFirst({ where: { subdomain } });

    if (existingTenant) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Este subdomain ya está en uso',
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      message: 'Subdomain disponible',
    });
  } catch (error) {
    logger.error('Error verificando subdomain', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al verificar subdomain',
      error: error.message,
    });
  }
};

/**
 * @route POST /api/platform-admin/tenants/create-manual
 * @desc Crea un tenant manualmente sin pasar por MercadoPago
 * @access Private (PLATFORM_ADMIN only)
 */
exports.createManualTenant = async (req, res) => {
  try {
    const {
      businessName,
      email,
      subdomain,
      cuit,
      phone,
      address,
      plan = 'free',
      durationDays = 30,
      maxAgents = 5,
      maxProperties = 100,
      features = ['clients', 'properties', 'leases', 'payments'],
      adminUsername,
      adminPassword,
      adminFullName,
      adminEmail,
    } = req.body;

    if (!businessName || !email || !subdomain) {
      return res.status(400).json({
        success: false,
        message: 'businessName, email y subdomain son requeridos',
      });
    }

    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,28}[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        success: false,
        message: 'Subdomain inválido. Solo letras minúsculas, números y guiones (no al inicio/fin).',
      });
    }

    const [existingTenantByEmail, existingSubdomain, existingCuit] = await Promise.all([
      prisma.tenants.findFirst({ where: { email } }),
      prisma.tenants.findFirst({ where: { subdomain } }),
      cuit ? prisma.tenants.findFirst({ where: { cuit } }) : Promise.resolve(null),
    ]);

    if (existingTenantByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tenant con ese email',
      });
    }

    if (existingSubdomain) {
      return res.status(400).json({
        success: false,
        message: 'El subdominio ya está en uso',
      });
    }

    if (existingCuit) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un tenant con ese CUIT',
      });
    }

    const generatedCuit = cuit || `99-${Math.floor(10000000 + Math.random() * 90000000)}-9`;

    // Buscar el plan en la BD para usar sus features reales
    const planRecord = await prisma.plans.findFirst({
      where: { planId: String(plan).toLowerCase(), isActive: true },
    });

    const resolvedFeatures = planRecord?.features
      ? planRecord.features
      : Array.isArray(features) ? { modules: features } : features;

    const resolvedMaxAgents = planRecord?.maxUsers ?? maxAgents;
    const resolvedMaxProperties = planRecord?.maxProperties ?? maxProperties;

    const newTenant = await prisma.tenants.create({
      data: {
        businessName,
        email,
        subdomain,
        cuit: generatedCuit,
        phone: phone || null,
        address: address || null,
        plan: String(plan).toUpperCase(),
        status: 'active',
        maxAgents: resolvedMaxAgents,
        maxProperties: resolvedMaxProperties,
        features: resolvedFeatures,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const startDate = new Date();
    const isLifetime = String(plan).toLowerCase() === 'lifetime';
    const endDate = isLifetime ? null : new Date();
    if (!isLifetime) endDate.setDate(endDate.getDate() + Number(durationDays));

    const subscription = await prisma.subscriptions.create({
      data: {
        tenantId: newTenant.tenantId,
        planId: String(plan).toLowerCase(),
        status: 'active',
        paymentProvider: 'manual',
        trialStart: null,
        trialEnd: null,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        billingCycle: isLifetime ? 'lifetime' : 'monthly',
        amount: 0,
        currency: 'ARS',
      },
    });

    let adminUser = null;
    if (adminUsername && adminPassword) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      adminUser = await prisma.admins.create({
        data: {
          tenantId: newTenant.tenantId,
          username: adminUsername,
          password: hashedPassword,
          fullName: adminFullName || businessName,
          email: adminEmail || email,
          role: 'SUPER_ADMIN',
        },
      });
    }

    // Pre-poblar company settings con los datos provistos en la creación
    await prisma.admin_settings.create({
      data: {
        tenant_id: newTenant.tenantId,
        company_name: businessName,
        company_email: email,
        company_phone: phone || '',
        company_address: address || '',
        company_cuit: generatedCuit,
        company_registration: '',
        company_city: '',
        company_province: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Tenant creado exitosamente',
      data: {
        tenant: newTenant,
        subscription,
        admin: adminUser
          ? {
              adminId: adminUser.adminId,
              username: adminUser.username,
              email: adminUser.email,
              temporaryPassword: adminPassword,
            }
          : null,
        loginUrl: `${process.env.FRONTEND_URL || 'yellow-mud-000b27d0f.6.azurestaticapps.net'}/${subdomain}/login`,
        expiresAt: endDate,
      },
    });
  } catch (error) {
    logger.error('Error creando tenant manual', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Error al crear tenant',
      error: error.message,
    });
  }
};


/**
 * @route POST /api/platform-admin/tenants/:tenantId/impersonate
 * @desc Genera un token temporal de corta duración para acceder al panel de un tenant
 * @access Private (PLATFORM_ADMIN only)
 */
const jwt = require('jsonwebtoken');

exports.impersonateTenant = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);

    const tenant = await prisma.tenants.findUnique({
      where: { tenantId },
      include: {
        admins: { where: { role: 'ADMIN' }, take: 1, orderBy: { createdAt: 'asc' } },
      },
    });

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant no encontrado' });
    }

    if (tenant.admins.length === 0) {
      return res.status(400).json({ success: false, message: 'Este tenant no tiene usuarios admin' });
    }

    const adminUser = tenant.admins[0];

    // Token de impersonación: 2 horas, marcado con impersonatedBy
    const impersonationToken = jwt.sign(
      {
        id: adminUser.adminId,
        role: adminUser.role,
        tenantId: adminUser.tenantId,
        impersonatedBy: req.user.id,
        impersonation: true,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '2h' }
    );

    logger.info('Platform admin impersonating tenant', {
      platformAdminId: req.user.id,
      tenantId,
      adminUserId: adminUser.adminId,
    });

    return res.status(200).json({
      success: true,
      token: impersonationToken,
      expiresIn: '2h',
      tenant: {
        tenantId: tenant.tenantId,
        businessName: tenant.businessName,
        subdomain: tenant.subdomain,
      },
      user: {
        adminId: adminUser.adminId,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    logger.error('Error en impersonateTenant', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al impersonar tenant', error: error.message });
  }
};

/**
 * @route PATCH /api/platform-admin/tenants/:tenantId/subscription
 * @desc Actualiza el estado y/o fechas de la suscripción de un tenant (útil para testing y gestión manual)
 * @access Private (PLATFORM_ADMIN only)
 */
exports.updateTenantSubscription = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const { status, planId, trialEnd, currentPeriodEnd, trialStart, currentPeriodStart } = req.body;

    const subscription = await prisma.subscriptions.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Suscripción no encontrada para este tenant' });
    }

    if (planId !== undefined) {
      const planRecord = await prisma.plans.findFirst({
        where: { planId: normalizePlanId(planId), isActive: true },
      });
      await syncTenantSubscriptionPlan(prisma, tenantId, planId, planRecord);
      const updated = await prisma.subscriptions.findFirst({
        where: { subscriptionId: subscription.subscriptionId },
      });
      await invalidateTenantCache(tenantId, null, null);
      return res.status(200).json({
        success: true,
        message: 'Plan y suscripción actualizados',
        data: updated,
      });
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (trialEnd !== undefined) updateData.trialEnd = trialEnd ? new Date(trialEnd) : null;
    if (trialStart !== undefined) updateData.trialStart = trialStart ? new Date(trialStart) : null;
    if (currentPeriodEnd !== undefined) {
      updateData.currentPeriodEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
    }
    if (currentPeriodStart !== undefined) {
      updateData.currentPeriodStart = currentPeriodStart ? new Date(currentPeriodStart) : null;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No se proporcionaron campos para actualizar' });
    }

    if (isLifetimeSubscription(subscription) && status === 'past_due') {
      return res.status(400).json({
        success: false,
        message: 'No se puede marcar como vencido un plan lifetime',
      });
    }

    const updated = await prisma.subscriptions.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: updateData,
    });

    if (trialEnd !== undefined) {
      await prisma.tenants.update({
        where: { tenantId },
        data: { trialEndsAt: trialEnd ? new Date(trialEnd) : null },
      });
    }

    if (status === 'active') {
      await prisma.tenants.update({
        where: { tenantId },
        data: { status: 'active' },
      });
    }

    await invalidateTenantCache(tenantId, null, null);

    logger.info('Suscripción actualizada por platform admin', { tenantId, updateData });

    return res.status(200).json({
      success: true,
      message: 'Suscripción actualizada exitosamente',
      data: updated,
    });
  } catch (error) {
    logger.error('Error en updateTenantSubscription', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al actualizar suscripción', error: error.message });
  }
};

/**
 * @route POST /api/platform-admin/tenants/:tenantId/reset-password
 * @desc Genera un link de reset de contraseña para el admin principal de un tenant,
 *       o fuerza una nueva contraseña directamente si se pasa `newPassword` en el body.
 * @access Private (PLATFORM_ADMIN only)
 */
exports.resetTenantAdminPassword = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const { newPassword } = req.body;

    // Obtener el admin principal del tenant
    const admin = await prisma.admins.findFirst({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'No se encontró un usuario admin para este tenant' });
    }

    // --- Opción A: forzar nueva contraseña directamente ---
    if (newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.admins.update({
        where: { adminId: admin.adminId },
        data: { password: hashed },
      });
      // Invalidar todos los tokens de reset pendientes
      await prisma.password_reset_tokens.updateMany({
        where: { adminId: admin.adminId, used: false },
        data: { used: true },
      });
      logger.info('Platform admin forzó cambio de contraseña', { tenantId, adminId: admin.adminId, platformAdminId: req.user.id });
      return res.status(200).json({
        success: true,
        message: `Contraseña actualizada para ${admin.email || admin.username}`,
      });
    }

    // --- Opción B: generar link de reset para enviar al usuario ---
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.password_reset_tokens.updateMany({
      where: { adminId: admin.adminId, used: false },
      data: { used: true },
    });
    await prisma.password_reset_tokens.create({
      data: {
        adminId: admin.adminId,
        email: admin.email || admin.username,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://app.GestProps.com.ar';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    logger.info('Platform admin generó link de reset', { tenantId, adminId: admin.adminId, platformAdminId: req.user.id });

    return res.status(200).json({
      success: true,
      message: 'Link de reset generado',
      data: {
        resetLink,
        expiresAt,
        admin: { adminId: admin.adminId, email: admin.email, username: admin.username },
      },
    });
  } catch (error) {
    logger.error('Error en resetTenantAdminPassword', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al resetear contraseña', error: error.message });
  }
};

/**
 * @route GET /api/platform-admin/tenants/:tenantId/operational
 * @desc Datos operacionales de un tenant (clientes, propiedades, contratos, pagos recientes)
 * @access Private (PLATFORM_ADMIN only)
 */
/**
 * @route GET /api/platform-admin/tenants/:tenantId/errors
 * @desc Errores recientes del tenant: fallos AFIP/fiscal, pagos rechazados, tickets críticos
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getTenantErrors = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // últimos 30 días

    const [fiscalErrors, paymentFailures, criticalTickets] = await Promise.all([
      // Errores AFIP / ARCA
      prisma.FiscalAuditLog.findMany({
        where: { tenantId, status: 'failure', createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, action: true, entityType: true, entityId: true, errorMessage: true, createdAt: true },
      }),
      // Pagos de suscripción rechazados o fallidos
      prisma.subscription_payment_logs.findMany({
        where: {
          tenantId,
          status: { notIn: ['approved', 'authorized', 'pending', 'in_process'] },
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, status: true, amount: true, currency: true, mpPaymentId: true, rawData: true, createdAt: true },
      }),
      // Tickets de soporte con prioridad alta o crítica aún abiertos
      prisma.support_tickets.findMany({
        where: {
          tenantId,
          priority: { in: ['CRITICA', 'ALTA'] },
          status: { in: ['ABIERTO', 'EN_PROGRESO'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, description: true, priority: true, status: true, category: true, createdAt: true },
      }),
    ]);

    const errors = [
      ...fiscalErrors.map((e) => ({
        id: `fiscal-${e.id}`,
        severity: 'error',
        source: 'fiscal',
        icon: '🧾',
        title: `Error AFIP: ${e.action}`,
        detail: e.errorMessage || `Entidad: ${e.entityType} #${e.entityId || '?'}`,
        date: e.createdAt,
      })),
      ...paymentFailures.map((p) => ({
        id: `payment-${p.id}`,
        severity: 'warning',
        source: 'suscripcion',
        icon: '💳',
        title: `Pago rechazado/fallido: ${p.status}`,
        detail: `${p.currency} ${p.amount ? Number(p.amount).toLocaleString('es-AR') : '—'}${p.rawData?.paymentStatusDetail ? ` — ${p.rawData.paymentStatusDetail}` : ''}`,
        date: p.createdAt,
      })),
      ...criticalTickets.map((t) => ({
        id: `ticket-${t.id}`,
        severity: t.priority === 'CRITICA' ? 'critical' : 'warning',
        source: 'soporte',
        icon: t.priority === 'CRITICA' ? '🚨' : '⚠️',
        title: `Ticket ${t.priority}: ${t.title}`,
        detail: `${t.category} — ${t.status}`,
        date: t.createdAt,
      })),
    ];

    errors.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      data: {
        errors,
        summary: {
          total: errors.length,
          fiscal: fiscalErrors.length,
          payments: paymentFailures.length,
          tickets: criticalTickets.length,
        },
      },
    });
  } catch (error) {
    logger.error('Error en getTenantErrors', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al obtener errores del tenant' });
  }
};

/**
 * @route GET /api/platform-admin/tenants/:tenantId/activity
 * @desc Feed de actividad reciente del tenant (eventos combinados de múltiples modelos)
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getTenantActivity = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const [clients, properties, leases, payments, tickets, fiscalLogs] = await Promise.all([
      prisma.Clients.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { idClient: true, name: true, createdAt: true },
      }),
      prisma.Property.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { propertyId: true, address: true, type: true, createdAt: true },
      }),
      prisma.Leases.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, status: true, createdAt: true },
      }),
      prisma.PaymentReceipts.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 15,
        select: { id: true, amount: true, status: true, period: true, createdAt: true },
      }),
      prisma.support_tickets.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, title: true, priority: true, status: true, createdAt: true },
      }),
      prisma.FiscalAuditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, action: true, entityType: true, status: true, createdAt: true },
      }),
    ]);

    const events = [
      ...clients.map((c) => ({
        id: `client-${c.idClient}`,
        type: 'cliente',
        icon: '👤',
        description: `Cliente creado: ${c.name}`,
        date: c.createdAt,
      })),
      ...properties.map((p) => ({
        id: `prop-${p.propertyId}`,
        type: 'propiedad',
        icon: '🏠',
        description: `Propiedad añadida: ${p.address}`,
        date: p.createdAt,
      })),
      ...leases.map((l) => ({
        id: `lease-${l.id}`,
        type: 'contrato',
        icon: '📄',
        description: `Contrato creado (estado: ${l.status || 'activo'})`,
        date: l.createdAt,
      })),
      ...payments.map((p) => ({
        id: `pay-${p.id}`,
        type: 'pago',
        icon: '💰',
        description: `Pago registrado: $${Number(p.amount).toLocaleString('es-AR')} — ${p.period} (${p.status})`,
        date: p.createdAt,
      })),
      ...tickets.map((t) => ({
        id: `ticket-${t.id}`,
        type: 'ticket',
        icon: '🎫',
        description: `Ticket: ${t.title} [${t.priority}]`,
        date: t.createdAt,
      })),
      ...fiscalLogs.map((f) => ({
        id: `fiscal-${f.id}`,
        type: 'fiscal',
        icon: '🧾',
        description: `Acción fiscal: ${f.action} — ${f.entityType} (${f.status})`,
        date: f.createdAt,
      })),
    ];

    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    const result = events.slice(0, limit);

    return res.status(200).json({ success: true, data: { events: result, total: result.length } });
  } catch (error) {
    logger.error('Error en getTenantActivity', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al obtener logs de actividad' });
  }
};

/**
 * @route POST /api/platform-admin/tenants/:tenantId/send-email
 * @desc Envía un email al admin del tenant desde la plataforma
 * @access Private (PLATFORM_ADMIN only)
 */
exports.sendEmailToTenant = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const { subject, body } = req.body;

    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: 'Asunto y cuerpo son requeridos' });
    }

    // Obtener email del admin del tenant
    const adminUser = await prisma.Users.findFirst({
      where: { tenantId, role: 'TENANT_ADMIN' },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!adminUser) {
      return res.status(404).json({ success: false, message: 'No se encontró admin del tenant' });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">Mensaje desde GestProps</h2>
        </div>
        <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #374151; white-space: pre-wrap;">${body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Este mensaje fue enviado por el equipo de soporte de GestProps.</p>
        </div>
      </div>
    `;

    await sendEmail({ to: adminUser.email, subject: subject.trim(), html });

    logger.info('Email enviado a tenant desde plataforma', { tenantId, to: adminUser.email, subject });

    return res.status(200).json({
      success: true,
      message: `Email enviado a ${adminUser.email}`,
    });
  } catch (error) {
    logger.error('Error en sendEmailToTenant', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al enviar el email' });
  }
};

/**
 * @route GET /api/platform-admin/tenants/:tenantId/payments
 * @desc Historial de pagos de suscripción del tenant
 * @access Private (PLATFORM_ADMIN only)
 */
exports.getTenantPayments = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [total, payments] = await Promise.all([
      prisma.subscription_payment_logs.count({ where: { tenantId } }),
      prisma.subscription_payment_logs.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          amount: true,
          currency: true,
          mpPaymentId: true,
          mpPreapprovalId: true,
          periodStart: true,
          periodEnd: true,
          createdAt: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    logger.error('Error en getTenantPayments', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al obtener historial de pagos' });
  }
};

exports.getTenantOperational = async (req, res) => {
  try {
    const tenantId = parseInt(req.params.tenantId, 10);

    const [clients, properties, leases, payments, leads, tickets] = await Promise.all([
      prisma.Clients.count({ where: { tenantId } }),
      prisma.Property.count({ where: { tenantId } }),
      prisma.Leases.count({ where: { tenantId } }),
      prisma.PaymentReceipts.count({ where: { tenantId } }),
      prisma.leads.count({ where: { tenantId } }),
      prisma.support_tickets.count({ where: { tenantId } }),
    ]);

    const recentActivity = await prisma.PaymentReceipts.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true, status: true, amount: true },
    });

    const openTickets = await prisma.support_tickets.findMany({
      where: { tenantId, status: { in: ['ABIERTO', 'EN_PROGRESO'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, priority: true, createdAt: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        counts: { clients, properties, leases, payments, leads, tickets },
        recentActivity,
        openTickets,
      },
    });
  } catch (error) {
    logger.error('Error en getTenantOperational', { tenantId: req.params.tenantId, error: error.message });
    return res.status(500).json({ success: false, message: 'Error al obtener datos operacionales' });
  }
};
