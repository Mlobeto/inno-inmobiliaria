/**
 * Script one-shot: activa features.loteos en todos los tenants activos
 * que están en el plan 'professional'.
 *
 * Uso:
 *   cd back
 *   node scripts/enable-loteos-professional.js
 */

require('dotenv').config();
const prisma = require('../src/utils/prismaClient');

async function main() {
  const tenants = await prisma.tenants.findMany({
    where: {
      plan: 'professional',
      deletedAt: null,
    },
    select: { tenantId: true, businessName: true, subdomain: true, features: true },
  });

  console.log(`\nTenants en plan professional encontrados: ${tenants.length}\n`);

  let updated = 0;
  for (const t of tenants) {
    const currentFeatures = t.features || {};

    if (currentFeatures.loteos === true) {
      console.log(`  ⏭  ${t.businessName} (${t.subdomain}) — ya tenía loteos:true, skip`);
      continue;
    }

    await prisma.tenants.update({
      where: { tenantId: t.tenantId },
      data: {
        features: { ...currentFeatures, loteos: true },
      },
    });

    console.log(`  ✅  ${t.businessName} (${t.subdomain}) — loteos activado`);
    updated++;
  }

  console.log(`\nActualizados: ${updated} / ${tenants.length} tenants`);
}

main()
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
