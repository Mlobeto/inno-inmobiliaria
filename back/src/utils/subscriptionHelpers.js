/**
 * Helpers para planes y consistencia tenant ↔ subscriptions ↔ modules.
 */

function normalizePlanId(planId) {
  return String(planId || '').trim().toLowerCase();
}

function isLifetimePlanId(planId) {
  return normalizePlanId(planId) === 'lifetime';
}

function isLifetimeSubscription(subscription) {
  if (!subscription) return false;
  return (
    isLifetimePlanId(subscription.planId) ||
    normalizePlanId(subscription.billingCycle) === 'lifetime'
  );
}

/** Datos de suscripción para plan lifetime (sin vencimiento). */
function buildLifetimeSubscriptionData() {
  return {
    planId: 'lifetime',
    status: 'active',
    billingCycle: 'lifetime',
    paymentProvider: 'manual',
    amount: 0,
    currency: 'ARS',
    trialStart: null,
    trialEnd: null,
    currentPeriodStart: new Date(),
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    canceledAt: null,
  };
}

function buildPaidPlanSubscriptionData(planRecord, existingSubscription = null, moduleIds = []) {
  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const keepValidEnd =
    existingSubscription?.currentPeriodEnd &&
    new Date(existingSubscription.currentPeriodEnd) > now
      ? new Date(existingSubscription.currentPeriodEnd)
      : periodEnd;

  // El monto base se calcula en el llamador que ya tiene los precios de módulos
  return {
    planId: normalizePlanId(planRecord.planId),
    status: 'active',
    billingCycle: 'monthly',
    amount: parseFloat(planRecord.priceMonthly || 0),
    currency: planRecord.currency || 'ARS',
    currentPeriodStart: existingSubscription?.currentPeriodStart || now,
    currentPeriodEnd: keepValidEnd,
    trialStart: null,
    trialEnd: null,
    cancelAtPeriodEnd: false,
  };
}

/**
 * Calcula las features efectivas del tenant: base plan + módulos activos.
 */
async function computeTenantFeatures(prisma, tenantId) {
  const basePlan = await prisma.plans.findUnique({ where: { planId: 'base' } });
  const baseFeatures = (basePlan?.features) || {};

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

  return { ...baseFeatures, ...moduleFeatures };
}

/**
 * Calcula precio total: base + módulos activos del tenant.
 */
async function computeTotalPrice(prisma, tenantId, extraModuleIds = []) {
  const basePlan = await prisma.plans.findUnique({ where: { planId: 'base' } });
  const basePrice = parseFloat(basePlan?.priceMonthly || 10000);

  // Módulos ya activos en BD
  const activeModules = await prisma.tenant_modules.findMany({
    where: { tenantId, status: 'active' },
    include: { modules: true },
  });

  // Módulos extra (al momento del registro, antes de crear tenant_modules)
  let extraPrice = 0;
  if (extraModuleIds.length > 0) {
    const extraModules = await prisma.modules.findMany({
      where: { moduleId: { in: extraModuleIds }, isActive: true },
    });
    extraPrice = extraModules.reduce((sum, m) => sum + parseFloat(m.price), 0);
  }

  const activePrice = activeModules.reduce(
    (sum, tm) => sum + parseFloat(tm.modules.price),
    0
  );

  return basePrice + activePrice + extraPrice;
}

/**
 * Activa módulos iniciales al registrar un tenant nuevo.
 */
async function activateInitialModules(prisma, tenantId, moduleIds = []) {
  if (!moduleIds || moduleIds.length === 0) return;

  const validModules = await prisma.modules.findMany({
    where: { moduleId: { in: moduleIds }, isActive: true },
  });

  await Promise.all(
    validModules.map((mod) =>
      prisma.tenant_modules.upsert({
        where: { uq_tenant_modules: { tenantId, moduleId: mod.moduleId } },
        update: { status: 'active', canceledAt: null },
        create: { tenantId, moduleId: mod.moduleId, status: 'active' },
      })
    )
  );
}

/**
 * Sincroniza la fila subscriptions más reciente con el plan del tenant (admin / cambio de plan).
 */
async function syncTenantSubscriptionPlan(prisma, tenantId, planId, planRecord) {
  const planIdNorm = normalizePlanId(planId);
  if (!planIdNorm) return null;

  let subscription = await prisma.subscriptions.findFirst({
    where: { tenantId, status: { in: ['trialing', 'active'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (!subscription) {
    subscription = await prisma.subscriptions.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  const subData = isLifetimePlanId(planIdNorm)
    ? buildLifetimeSubscriptionData()
    : planRecord
      ? buildPaidPlanSubscriptionData(planRecord, subscription)
      : {
          planId: planIdNorm,
          status: 'active',
        };

  // Calcular precio total real (base + módulos)
  if (!isLifetimePlanId(planIdNorm)) {
    const totalPrice = await computeTotalPrice(prisma, tenantId);
    subData.amount = totalPrice;
  }

  let updated;
  if (subscription) {
    updated = await prisma.subscriptions.update({
      where: { subscriptionId: subscription.subscriptionId },
      data: subData,
    });
  } else {
    updated = await prisma.subscriptions.create({
      data: {
        tenantId,
        ...subData,
        paymentProvider: subData.paymentProvider || 'manual',
      },
    });
  }

  // Sincronizar features del tenant
  const features = await computeTenantFeatures(prisma, tenantId);

  await prisma.tenants.update({
    where: { tenantId },
    data: {
      plan: planIdNorm.toUpperCase(),
      features,
      ...(isLifetimePlanId(planIdNorm) ? { status: 'active', trialEndsAt: null } : {}),
    },
  });

  return updated;
}

module.exports = {
  normalizePlanId,
  isLifetimePlanId,
  isLifetimeSubscription,
  buildLifetimeSubscriptionData,
  buildPaidPlanSubscriptionData,
  computeTenantFeatures,
  computeTotalPrice,
  activateInitialModules,
  syncTenantSubscriptionPlan,
};

