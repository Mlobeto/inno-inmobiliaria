const prisma = require('../utils/prismaClient');
const { invalidateTenantCache } = require('../utils/tenantCache');
const logger = require('../utils/logger');

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

    res.status(200).json({
      success: true,
      data: {
        tenant,
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
    const { businessName, email, phone, address, plan, status, maxAgents, maxProperties, features } = req.body;

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant no encontrado',
      });
    }

    // Si se cambió el plan, sincronizar features/límites desde la BD de planes
    let resolvedFeatures = features !== undefined ? features : tenant.features;
    let resolvedMaxAgents = maxAgents !== undefined ? maxAgents : tenant.maxAgents;
    let resolvedMaxProperties = maxProperties !== undefined ? maxProperties : tenant.maxProperties;

    if (plan !== undefined && plan !== tenant.plan) {
      const planRecord = await prisma.plans.findFirst({
        where: { planId: plan.toLowerCase(), isActive: true },
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
      },
    });

    await invalidateTenantCache(tenant.tenantId, tenant.subdomain, null);

    res.status(200).json({
      success: true,
      message: 'Tenant actualizado exitosamente',
      data: updated,
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
      const bcrypt = require('bcrypt');
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
        loginUrl: `${process.env.FRONTEND_URL || 'https://inno-inmobiliaria.vercel.app'}/${subdomain}/login`,
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
 * @route GET /api/platform-admin/tenants/:tenantId/operational
 * @desc Datos operacionales de un tenant (clientes, propiedades, contratos, pagos recientes)
 * @access Private (PLATFORM_ADMIN only)
 */
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
