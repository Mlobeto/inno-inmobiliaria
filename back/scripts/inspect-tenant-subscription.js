/**
 * Uso: node scripts/inspect-tenant-subscription.js mercedes
 */
require('dotenv').config();
const search = process.argv[2] || 'mercedes';
if (!process.env.DATABASE_URL) {
  console.error('Definí DATABASE_URL en el entorno');
  process.exit(1);
}
const prisma = require('../src/utils/prismaClient');

async function main() {
  const admins = await prisma.admins.findMany({
    where: {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ],
    },
    include: {
      tenants: {
        include: {
          subscriptions: { orderBy: { createdAt: 'desc' }, include: { plans: true } },
        },
      },
    },
  });

  console.log(JSON.stringify(admins, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
