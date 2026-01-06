/**
 * Script para crear el Platform Admin (super admin) en producción (Neon)
 * 
 * Uso: node scripts/seed-platform-admin-production.js
 * 
 * Este script:
 * 1. Carga variables de entorno desde .env.production
 * 2. Conecta a la base de datos de producción
 * 3. Crea el admin con tenantId = null (platform admin)
 * 4. Encripta la contraseña con bcrypt
 */

require('dotenv').config({ path: '.env.production' });
const { sequelize, Admin } = require('../src/data');
const bcrypt = require('bcrypt');

async function seedPlatformAdmin() {
  try {
    console.log('\n🚀 Iniciando creación de Platform Admin...\n');
    console.log('📊 Configuración:');
    console.log(`   - Base de datos: ${process.env.DB_NAME}`);
    console.log(`   - Host: ${process.env.DB_HOST}`);
    console.log(`   - Usuario: ${process.env.DB_USER}\n`);

    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Verificar variables de entorno
    const username = process.env.PLATFORM_ADMIN_USERNAME;
    const password = process.env.PLATFORM_ADMIN_PASSWORD;
    const email = process.env.PLATFORM_ADMIN_EMAIL;
    const fullName = process.env.PLATFORM_ADMIN_NAME;

    if (!username || !password || !email) {
      console.error('❌ ERROR: Faltan variables de entorno requeridas:');
      console.error('   - PLATFORM_ADMIN_USERNAME');
      console.error('   - PLATFORM_ADMIN_PASSWORD');
      console.error('   - PLATFORM_ADMIN_EMAIL');
      console.error('\n   Por favor verifica tu archivo .env.production');
      process.exit(1);
    }

    console.log('👤 Datos del Platform Admin:');
    console.log(`   - Username: ${username}`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Nombre: ${fullName || 'Platform Admin'}`);
    console.log(`   - Contraseña: ${'*'.repeat(password.length)}\n`);

    // Verificar que existe la tabla admins
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admins'"
    );

    if (tables.length === 0) {
      console.error('❌ ERROR: La tabla "admins" no existe.');
      console.error('   Por favor ejecuta primero: node scripts/init-production-tables.js');
      process.exit(1);
    }

    // Verificar si ya existe un platform admin
    console.log('🔍 Verificando si ya existe un platform admin...');
    const existingAdmin = await Admin.findOne({
      where: { tenantId: null, username }
    });

    if (existingAdmin) {
      console.log('⚠️  Ya existe un platform admin con ese username.');
      console.log('\n❓ ¿Deseas actualizar la contraseña? (y/n)');
      
      // Para scripts automatizados, actualizar automáticamente
      console.log('🔄 Actualizando contraseña...\n');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      await existingAdmin.update({
        password: hashedPassword,
        email,
        fullName: fullName || existingAdmin.fullName
      });

      console.log('✅ Platform Admin actualizado exitosamente');
      console.log(`   - ID: ${existingAdmin.adminId}`);
      console.log(`   - Username: ${existingAdmin.username}`);
      console.log(`   - Email: ${existingAdmin.email}\n`);

    } else {
      // Crear nuevo platform admin
      console.log('📝 Creando nuevo platform admin...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const admin = await Admin.create({
        username,
        password: hashedPassword,
        email,
        fullName: fullName || 'Platform Admin',
        role: 'PLATFORM_ADMIN',  // Importante: especificar rol
        tenantId: null  // null = platform admin
      });

      console.log('\n✅ Platform Admin creado exitosamente');
      console.log(`   - ID: ${admin.adminId}`);
      console.log(`   - Username: ${admin.username}`);
      console.log(`   - Email: ${admin.email}`);
      console.log(`   - TenantId: null (platform admin)\n`);
    }

    // Mostrar todos los admins
    console.log('📊 Admins en base de datos:\n');
    const allAdmins = await Admin.findAll({
      attributes: ['adminId', 'username', 'email', 'tenantId', 'createdAt']
    });

    console.table(
      allAdmins.map(a => ({
        ID: a.adminId,
        Username: a.username,
        Email: a.email,
        TenantId: a.tenantId === null ? '🌐 Platform' : a.tenantId,
        'Creado en': a.createdAt.toLocaleDateString()
      }))
    );

    console.log('\n✅ Proceso completado exitosamente');
    console.log('\n📌 Próximos pasos:');
    console.log('   1. Acceder a tu frontend de producción');
    console.log('   2. Ir a /platform-admin');
    console.log(`   3. Login con usuario: ${username}`);
    console.log('   4. Podrás gestionar todos los tenants desde el dashboard\n');

    console.log('⚠️  IMPORTANTE:');
    console.log('   - Guarda bien las credenciales del platform admin');
    console.log('   - Cambia la contraseña desde el panel si usas una temporal');
    console.log('   - El platform admin puede ver y gestionar todos los tenants\n');

  } catch (error) {
    console.error('\n❌ Error durante la creación del platform admin:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada\n');
  }
}

// Ejecutar
seedPlatformAdmin();
