require('dotenv').config({ path: '.env.production' });

const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prismaClient');

const REQUIRED_CONFIRMATION = 'DELETE_PRODUCTION_DATA';

function getArgValue(name) {
  const arg = process.argv.find((item) => item.startsWith(`${name}=`));
  return arg ? arg.split('=').slice(1).join('=') : undefined;
}

function assertSafetyChecks() {
  const cliConfirm = getArgValue('--confirm');
  const envConfirm = process.env.RESET_PRODUCTION_ACK;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está definida.');
  }

  if (cliConfirm !== REQUIRED_CONFIRMATION || envConfirm !== REQUIRED_CONFIRMATION) {
    throw new Error(
      `Confirmación inválida. Debes usar --confirm=${REQUIRED_CONFIRMATION} y RESET_PRODUCTION_ACK=${REQUIRED_CONFIRMATION}`
    );
  }
}

async function truncateAllData() {
  const tables = await prisma.$queryRawUnsafe(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename;
  `);

  if (!tables.length) {
    console.log('ℹ️ No se encontraron tablas para truncar.');
    return;
  }

  const tableList = tables
    .map((row) => `"public"."${row.tablename}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
  console.log(`✅ Datos truncados en ${tables.length} tablas.`);
}

async function createPlatformAdmin() {
  const username = process.env.PLATFORM_ADMIN_USERNAME || 'platform_admin';
  const password = process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeMe123!';
  const email = process.env.PLATFORM_ADMIN_EMAIL || 'admin@innoinmo.com';
  const fullName = process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admins.create({
    data: {
      username,
      password: passwordHash,
      email,
      fullName,
      role: 'PLATFORM_ADMIN',
      tenantId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ PLATFORM_ADMIN creado (adminId=${admin.adminId}, username=${username}).`);
  return admin;
}

async function createTenantForSuperAdmin() {
  const businessName = process.env.SUPER_ADMIN_TENANT_NAME || 'Tenant Demo';
  const subdomain = process.env.SUPER_ADMIN_TENANT_SUBDOMAIN || 'demo';
  const cuit = process.env.SUPER_ADMIN_TENANT_CUIT || `99-${Math.floor(10000000 + Math.random() * 90000000)}-9`;
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@demo.com';

  const tenant = await prisma.tenants.create({
    data: {
      businessName,
      subdomain,
      cuit,
      email,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ Tenant bootstrap creado (tenantId=${tenant.tenantId}, subdomain=${tenant.subdomain}).`);
  return tenant;
}

async function createSuperAdmin(tenantId) {
  const username = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@demo.com';
  const fullName = process.env.SUPER_ADMIN_NAME || 'Super Administrator';

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admins.create({
    data: {
      username,
      password: passwordHash,
      email,
      fullName,
      role: 'SUPER_ADMIN',
      tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log(`✅ SUPER_ADMIN creado (adminId=${admin.adminId}, username=${username}, tenantId=${tenantId}).`);
  return admin;
}

async function main() {
  try {
    assertSafetyChecks();

    console.log('⚠️ Iniciando reseteo de datos en la base configurada...');
    await truncateAllData();

    const platformAdmin = await createPlatformAdmin();
    const tenant = await createTenantForSuperAdmin();
    const superAdmin = await createSuperAdmin(tenant.tenantId);

    console.log('\n🎉 Reseteo completado.');
    console.log(`   - PLATFORM_ADMIN: ${platformAdmin.username}`);
    console.log(`   - SUPER_ADMIN: ${superAdmin.username} (tenantId=${tenant.tenantId})`);
  } catch (error) {
    console.error('❌ Error durante reseteo:', error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
