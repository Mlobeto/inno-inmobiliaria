/**
 * Helpers para planes lifetime y consistencia tenant ↔ subscriptions.
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

function buildPaidPlanSubscriptionData(planRecord, existingSubscription = null) {
  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  const keepValidEnd =
    existingSubscription?.currentPeriodEnd &&
    new Date(existingSubscription.currentPeriodEnd) > now
      ? new Date(existingSubscription.currentPeriodEnd)
      : periodEnd;

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

  const tenantPatch = {
    plan: planIdNorm.toUpperCase(),
    ...(isLifetimePlanId(planIdNorm)
      ? { status: 'active', trialEndsAt: null }
      : {}),
  };

  await prisma.tenants.update({
    where: { tenantId },
    data: tenantPatch,
  });

  return updated;
}

module.exports = {
  normalizePlanId,
  isLifetimePlanId,
  isLifetimeSubscription,
  buildLifetimeSubscriptionData,
  buildPaidPlanSubscriptionData,
  syncTenantSubscriptionPlan,
};
