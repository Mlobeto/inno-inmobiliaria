const prisma = require('../utils/prismaClient');

/**
 * GET /api/modules
 * Lista todos los módulos activos (público, para landing y registro).
 */
async function listModules(req, res) {
  try {
    const modules = await prisma.modules.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ modules });
  } catch (error) {
    console.error('Error listando módulos:', error);
    res.status(500).json({ error: 'Error al obtener módulos' });
  }
}

/**
 * GET /api/modules/tenant
 * Módulos activos del tenant autenticado.
 */
async function getTenantModules(req, res) {
  try {
    const tenantId = req.tenant.tenantId;
    const tenantModules = await prisma.tenant_modules.findMany({
      where: { tenantId, status: 'active' },
      include: { modules: true },
      orderBy: { modules: { sortOrder: 'asc' } },
    });
    res.json({ modules: tenantModules });
  } catch (error) {
    console.error('Error obteniendo módulos del tenant:', error);
    res.status(500).json({ error: 'Error al obtener módulos' });
  }
}

/**
 * POST /api/modules/activate
 * Activa uno o más módulos para el tenant. Recalcula el precio total de la suscripción.
 * Body: { moduleIds: string[] }
 */
async function activateModules(req, res) {
  try {
    const tenantId = req.tenant.tenantId;
    const { moduleIds } = req.body;

    if (!moduleIds || !Array.isArray(moduleIds) || moduleIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de moduleIds' });
    }

    // Verificar que los módulos existan y estén activos
    const modules = await prisma.modules.findMany({
      where: { moduleId: { in: moduleIds }, isActive: true },
    });

    if (modules.length !== moduleIds.length) {
      return res.status(400).json({ error: 'Uno o más módulos no son válidos' });
    }

    // Activar módulos (upsert)
    await Promise.all(
      modules.map((mod) =>
        prisma.tenant_modules.upsert({
          where: { uq_tenant_modules: { tenantId, moduleId: mod.moduleId } },
          update: { status: 'active', canceledAt: null },
          create: { tenantId, moduleId: mod.moduleId, status: 'active' },
        })
      )
    );

    // Sincronizar features del tenant
    await syncTenantFeatures(tenantId);

    // Recalcular precio total de la suscripción
    const newTotal = await recalculateSubscriptionPrice(tenantId);

    res.json({
      message: 'Módulos activados correctamente',
      newTotalPrice: newTotal,
    });
  } catch (error) {
    console.error('Error activando módulos:', error);
    res.status(500).json({ error: 'Error al activar módulos' });
  }
}

/**
 * POST /api/modules/deactivate
 * Desactiva un módulo para el tenant.
 * Body: { moduleId: string }
 */
async function deactivateModule(req, res) {
  try {
    const tenantId = req.tenant.tenantId;
    const { moduleId } = req.body;

    if (!moduleId) {
      return res.status(400).json({ error: 'Se requiere moduleId' });
    }

    await prisma.tenant_modules.updateMany({
      where: { tenantId, moduleId },
      data: { status: 'canceled', canceledAt: new Date() },
    });

    await syncTenantFeatures(tenantId);
    const newTotal = await recalculateSubscriptionPrice(tenantId);

    res.json({
      message: 'Módulo desactivado',
      newTotalPrice: newTotal,
    });
  } catch (error) {
    console.error('Error desactivando módulo:', error);
    res.status(500).json({ error: 'Error al desactivar módulo' });
  }
}

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * Recalcula y guarda en tenants.features las features del plan base + módulos activos.
 */
async function syncTenantFeatures(tenantId) {
  // Features base del plan
  const tenant = await prisma.tenants.findUnique({
    where: { tenantId },
    include: {
      subscriptions: {
        where: { status: { in: ['trialing', 'active'] } },
        include: { plans: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const basePlan = await prisma.plans.findUnique({ where: { planId: 'base' } });
  const baseFeatures = basePlan?.features || {};

  // Features de módulos activos
  const activeModules = await prisma.tenant_modules.findMany({
    where: { tenantId, status: 'active' },
    include: { modules: true },
  });

  const moduleFeatures = {};
  for (const tm of activeModules) {
    const keys = tm.modules.featureKeys;
    if (Array.isArray(keys)) {
      keys.forEach((key) => { moduleFeatures[key] = true; });
    }
  }

  const computedFeatures = { ...baseFeatures, ...moduleFeatures };

  await prisma.tenants.update({
    where: { tenantId },
    data: { features: computedFeatures },
  });

  return computedFeatures;
}

/**
 * Calcula precio total = base + sum(módulos activos) y actualiza subscription.amount.
 */
async function recalculateSubscriptionPrice(tenantId) {
  const basePlan = await prisma.plans.findUnique({ where: { planId: 'base' } });
  const basePrice = parseFloat(basePlan?.priceMonthly || 10000);

  const activeModules = await prisma.tenant_modules.findMany({
    where: { tenantId, status: 'active' },
    include: { modules: true },
  });

  const modulesTotal = activeModules.reduce(
    (sum, tm) => sum + parseFloat(tm.modules.price),
    0
  );

  const totalPrice = basePrice + modulesTotal;

  // Actualizar subscription activa/trialing
  await prisma.subscriptions.updateMany({
    where: { tenantId, status: { in: ['trialing', 'active'] } },
    data: { amount: totalPrice },
  });

  return totalPrice;
}

module.exports = {
  listModules,
  getTenantModules,
  activateModules,
  deactivateModule,
  syncTenantFeatures,
  recalculateSubscriptionPrice,
};
