/**
 * Idempotente: crea tenant demo + usuario SUPER_ADMIN del inmobiliaria (no Platform Admin).
 * Variables (opcionales, con valores por defecto): SUPER_ADMIN_TENANT_*, SUPER_ADMIN_USERNAME, etc.
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prismaClient');

async function main() {
  const businessName = process.env.SUPER_ADMIN_TENANT_NAME || 'Tenant Demo';
  const subdomain = process.env.SUPER_ADMIN_TENANT_SUBDOMAIN || 'demo';
  const cuit =
    process.env.SUPER_ADMIN_TENANT_CUIT ||
    `99-${Math.floor(10000000 + Math.random() * 90000000)}-9`;

  let tenant = await prisma.tenants.findFirst({ where: { subdomain } });
  if (!tenant) {
    tenant = await prisma.tenants.create({
      data: {
        businessName,
        subdomain,
        cuit,
        email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@demo.com',
      },
    });
    console.log(`✅ Tenant creado tenantId=${tenant.tenantId} subdomain=${tenant.subdomain}`);
  } else {
    console.log(`ℹ️  Tenant ya existía tenantId=${tenant.tenantId} subdomain=${tenant.subdomain}`);
  }

  const username = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@demo.com';
  const fullName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.admins.findFirst({
    where: { tenantId: tenant.tenantId, username },
  });

  if (existing) {
    await prisma.admins.update({
      where: { adminId: existing.adminId },
      data: {
        password: hash,
        email,
        fullName,
        updatedAt: new Date(),
      },
    });
    console.log(`✅ SUPER_ADMIN actualizado adminId=${existing.adminId} username=${username}`);
  } else {
    const admin = await prisma.admins.create({
      data: {
        username,
        password: hash,
        email,
        fullName,
        role: 'SUPER_ADMIN',
        tenantId: tenant.tenantId,
      },
    });
    console.log(`✅ SUPER_ADMIN creado adminId=${admin.adminId} username=${username}`);
  }

  console.log('\nCredenciales (entorno por defecto):');
  console.log(`   subdomain: ${subdomain}  usuario: ${username}  contraseña: (SUPER_ADMIN_PASSWORD o por defecto ChangeMe123!)`);
}

main()
  .catch((err) => {
    console.error('❌', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
