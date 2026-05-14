/**
 * Crea un tenant + admin + suscripción en trial con período ya vencido
 * (currentPeriodEnd en el pasado). La primera llamada a GET /subscriptions/current
 * marcará la suscripción como past_due.
 *
 * Uso (desde carpeta back, con .env cargado):
 *   node src/scripts/createQaTenantExpiredTrial.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcrypt');
const prisma = require('../utils/prismaClient');

const DEFAULT_PASSWORD = 'TestTrialExpired123!';

async function main() {
  const plan = await prisma.plans.findFirst({
    where: { isActive: true, planId: { not: 'lifetime' } },
    orderBy: { sortOrder: 'asc' },
  });

  if (!plan) {
    throw new Error('No hay ningún plan activo en la base (tabla plans).');
  }

  const sfx = Date.now();
  const subdomain = `qa-trial-exp-${sfx}`;
  const cuit = `99-${String(Math.floor(10000000 + Math.random() * 90000000))}-9`;
  const email = `qa-trial-exp-${sfx}@qa.innoinmo.local`;
  // Mismo criterio que el registro: el login usa el email como username.
  const username = email;

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() - 1);
  const trialStart = new Date(trialEnd);
  trialStart.setDate(trialStart.getDate() - 14);

  const passwordPlain = process.env.QA_EXPIRED_TRIAL_PASSWORD || DEFAULT_PASSWORD;
  const hashedPassword = await bcrypt.hash(passwordPlain, 10);

  const result = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenants.create({
      data: {
        businessName: `QA trial vencido (${sfx})`,
        email,
        cuit,
        subdomain,
        status: plan.trialDays > 0 ? 'trialing' : 'active',
        plan: plan.planId.toUpperCase(),
        maxAgents: 2,
        maxProperties: 50,
        features: plan.features || {},
        trialEndsAt: trialEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const admin = await tx.admins.create({
      data: {
        tenantId: tenant.tenantId,
        username,
        password: hashedPassword,
        fullName: 'QA Trial vencido',
        email,
        role: 'SUPER_ADMIN',
      },
    });

    const subscription = await tx.subscriptions.create({
      data: {
        tenantId: tenant.tenantId,
        planId: plan.planId,
        status: 'trialing',
        paymentProvider: 'manual',
        trialStart,
        trialEnd,
        currentPeriodStart: trialStart,
        currentPeriodEnd: trialEnd,
        billingCycle: 'monthly',
        amount: plan.priceMonthly,
        currency: plan.currency || 'ARS',
      },
    });

    return { tenant, admin, subscription };
  });

  console.log(JSON.stringify({
    ok: true,
    planId: plan.planId,
    tenantId: result.tenant.tenantId,
    subdomain: result.tenant.subdomain,
    adminId: result.admin.adminId,
    loginEmail: email,
    password: passwordPlain,
    subscriptionId: result.subscription.subscriptionId,
    hint: 'Iniciá sesión y abrí /subscription; el backend pasará la suscripción a past_due.',
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
