const prisma = require('../utils/prismaClient');

const BASE_FEATURES = {
  properties: true,
  rentals: true,
  sales: true,
  clients: true,
  contracts: true,
  receipts: true,
  balance: true,
  pdfTemplates: true,
  estadisticas: true,
  exportData: true,
  maxProperties: -1,
  maxClients: -1,
  maxUsers: -1,
};

/**
 * Features del plan lifetime = base + todos los módulos del catálogo activos.
 */
async function buildLifetimeFeatures() {
  const modules = await prisma.modules.findMany({ where: { isActive: true } });
  const moduleFeatures = {};
  for (const mod of modules) {
    const keys = mod.featureKeys;
    if (Array.isArray(keys)) {
      keys.forEach((key) => { moduleFeatures[key] = true; });
    }
  }
  return {
    ...BASE_FEATURES,
    ...moduleFeatures,
    maxUsers: -1,
  };
}

/**
 * Sincroniza el plan lifetime con todos los feature keys de módulos activos.
 */
async function refreshLifetimePlanFeatures() {
  const features = await buildLifetimeFeatures();
  await prisma.plans.upsert({
    where: { planId: 'lifetime' },
    update: { features, isActive: true },
    create: {
      planId: 'lifetime',
      name: 'Plan Lifetime',
      description: 'Acceso completo permanente (solo Platform Admin).',
      priceMonthly: 0,
      currency: 'ARS',
      trialDays: 0,
      isActive: true,
      isPopular: false,
      sortOrder: 99,
      features,
    },
  });

  // Propagar features a tenants con plan lifetime
  await prisma.tenants.updateMany({
    where: {
      OR: [
        { plan: { equals: 'lifetime', mode: 'insensitive' } },
        { plan: { equals: 'LIFETIME', mode: 'insensitive' } },
      ],
    },
    data: { features },
  });

  const lifetimeSubs = await prisma.subscriptions.findMany({
    where: { planId: 'lifetime', status: { in: ['active', 'trialing'] } },
    select: { tenantId: true },
  });
  const tenantIds = [...new Set(lifetimeSubs.map((s) => s.tenantId))];
  if (tenantIds.length) {
    await prisma.tenants.updateMany({
      where: { tenantId: { in: tenantIds } },
      data: { features },
    });
  }

  return features;
}

/**
 * GET /api/platform-admin/modules
 * Catálogo completo de módulos (incluye inactivos).
 */
async function listModulesAdmin(req, res) {
  try {
    const modules = await prisma.modules.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ success: true, modules });
  } catch (error) {
    console.error('Error listando módulos (admin):', error);
    res.status(500).json({ success: false, message: 'Error al obtener módulos' });
  }
}

/**
 * PUT /api/platform-admin/modules/:moduleId
 * Actualiza precio y metadatos de un módulo del catálogo.
 */
async function updateModuleCatalog(req, res) {
  try {
    const { moduleId } = req.params;
    const { name, description, price, isActive, sortOrder, question } = req.body;

    const existing = await prisma.modules.findUnique({ where: { moduleId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Módulo no encontrado' });
    }

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (question !== undefined) data.question = question;
    if (price !== undefined) data.price = parseFloat(price);
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10);

    const module = await prisma.modules.update({
      where: { moduleId },
      data,
    });

    await refreshLifetimePlanFeatures();

    res.json({
      success: true,
      message: 'Módulo actualizado',
      module,
    });
  } catch (error) {
    console.error('Error actualizando módulo:', error);
    res.status(500).json({ success: false, message: 'Error al actualizar módulo' });
  }
}

module.exports = {
  listModulesAdmin,
  updateModuleCatalog,
  buildLifetimeFeatures,
  refreshLifetimePlanFeatures,
};
