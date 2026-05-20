/**
 * Corrige tenant con plan LIFETIME en tenants pero suscripción vencida en subscriptions.
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." node scripts/fix-tenant-lifetime.js mercedeslobeto
 *   DATABASE_URL="postgresql://..." node scripts/fix-tenant-lifetime.js --tenant-id 42
 */
require('dotenv').config();
const prisma = require('../src/utils/prismaClient');
const { syncTenantSubscriptionPlan } = require('../src/utils/subscriptionHelpers');

async function main() {
  const arg = process.argv[2];
  const tenantIdFlag = process.argv.indexOf('--tenant-id');
  let tenant = null;

  if (tenantIdFlag !== -1) {
    const tenantId = parseInt(process.argv[tenantIdFlag + 1], 10);
    tenant = await prisma.tenants.findUnique({ where: { tenantId } });
  } else if (arg) {
    tenant = await prisma.tenants.findFirst({
      where: {
        OR: [
          { subdomain: { contains: arg, mode: 'insensitive' } },
          { email: { contains: arg, mode: 'insensitive' } },
        ],
      },
    });
    if (!tenant) {
      const admin = await prisma.admins.findFirst({
        where: {
          OR: [
            { email: { contains: arg, mode: 'insensitive' } },
            { username: { contains: arg, mode: 'insensitive' } },
          ],
        },
      });
      if (admin) {
        tenant = await prisma.tenants.findUnique({ where: { tenantId: admin.tenantId } });
      }
    }
  }

  if (!tenant) {
    console.error('Tenant no encontrado');
    process.exit(1);
  }

  const planRecord = await prisma.plans.findFirst({
    where: { planId: 'lifetime', isActive: true },
  });

  const sub = await syncTenantSubscriptionPlan(prisma, tenant.tenantId, 'lifetime', planRecord);

  console.log('OK', {
    tenantId: tenant.tenantId,
    businessName: tenant.businessName,
    subscriptionId: sub?.subscriptionId,
    status: sub?.status,
    planId: sub?.planId,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
