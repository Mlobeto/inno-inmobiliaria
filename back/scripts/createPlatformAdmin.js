/**
 * Script Node.js para crear un usuario PLATFORM_ADMIN
 * Ejecutar con: node back/scripts/createPlatformAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prismaClient');

async function createPlatformAdmin() {
  try {
    const username = process.env.PLATFORM_ADMIN_USERNAME || 'platform_admin';
    const password = process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeMe123!';
    const email = process.env.PLATFORM_ADMIN_EMAIL || 'admin@innoinmo.com';
    const fullName = process.env.PLATFORM_ADMIN_NAME || 'Platform Administrator';

    console.log('\n🔐 Creando usuario PLATFORM_ADMIN...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Username: ${username}`);

    const existing = await prisma.admins.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: {
        adminId: true,
        username: true,
        email: true,
      },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      await prisma.admins.update({
        where: { adminId: existing.adminId },
        data: {
          role: 'PLATFORM_ADMIN',
          tenantId: null,
          password: hashedPassword,
          fullName,
          email,
        },
      });

      console.log('\n✅ Usuario actualizado a PLATFORM_ADMIN');
      console.log(existing);
      return existing;
    }

    const result = await prisma.admins.create({
      data: {
        tenantId: null,
        username,
        password: hashedPassword,
        fullName,
        email,
        role: 'PLATFORM_ADMIN',
      },
      select: {
        adminId: true,
        username: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    console.log('\n✅ Usuario PLATFORM_ADMIN creado exitosamente:');
    console.log(result);
    console.log('\n⚠️  IMPORTANTE:');
    console.log('1. Cambia la contraseña después del primer login');
    console.log(`2. Agrega este email al .env: PLATFORM_ADMIN_EMAILS=${email}`);
    console.log('3. No compartas estas credenciales');
    console.log('\n🔑 Credenciales temporales:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);

    return result;
  } catch (error) {
    console.error('\n❌ Error creando Platform Admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createPlatformAdmin()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falló:', error);
    process.exit(1);
  });
