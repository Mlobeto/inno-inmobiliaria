require('dotenv').config({ path: '.env.production' });
const prisma = require('../src/utils/prismaClient');
const bcrypt = require('bcrypt');

async function seedPlatformAdmin() {
  try {
    console.log('\n🚀 Iniciando creación de Platform Admin...\n');

    const username = process.env.PLATFORM_ADMIN_USERNAME;
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    const email = process.env.PLATFORM_ADMIN_EMAIL;
    const fullName = process.env.PLATFORM_ADMIN_NAME;

    if (!username || !password || !email) {
      console.error('❌ ERROR: Faltan variables de entorno requeridas');
      process.exit(1);
    }

    const tables = await prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins'"
    );

    if (!tables.length) {
      console.error('❌ ERROR: La tabla "admins" no existe.');
      process.exit(1);
    }

    const existingAdmin = await prisma.admins.findFirst({
      where: { tenantId: null, username },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingAdmin) {
      await prisma.admins.update({
        where: { adminId: existingAdmin.adminId },
        data: {
          password: hashedPassword,
          email,
          fullName: fullName || existingAdmin.fullName,
        },
      });
      console.log('✅ Platform Admin actualizado exitosamente');
    } else {
      const admin = await prisma.admins.create({
        data: {
          username,
          password: hashedPassword,
          email,
          fullName: fullName || 'Platform Admin',
          role: 'PLATFORM_ADMIN',
          tenantId: null,
        },
      });
      console.log('✅ Platform Admin creado exitosamente', admin.adminId);
    }

    const allAdmins = await prisma.admins.findMany({
      select: {
        adminId: true,
        username: true,
        email: true,
        tenantId: true,
        createdAt: true,
      },
      orderBy: { adminId: 'asc' },
    });

    console.table(
      allAdmins.map((a) => ({
        ID: a.adminId,
        Username: a.username,
        Email: a.email,
        TenantId: a.tenantId === null ? '🌐 Platform' : a.tenantId,
        'Creado en': new Date(a.createdAt).toLocaleDateString(),
      }))
    );

    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('\n❌ Error durante la creación del platform admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada\n');
  }
}

seedPlatformAdmin();
