/**
 * Script para inicializar base de datos de producción
 * Ejecutar: node scripts/init-production-tables.js
 *
 * Nota: En Prisma, la creación de tablas se realiza vía migraciones (`prisma migrate deploy`).
 */

require('dotenv').config({ path: '.env.production' });
const { execSync } = require('child_process');
const prisma = require('../src/utils/prismaClient');

async function initDatabase() {
  console.log('🚀 Inicializando Base de Datos de Producción');
  console.log('');

  try {
    console.log('🔌 Probando conexión...');
    await prisma.$queryRawUnsafe('SELECT 1');
    console.log('✅ Conexión exitosa');
    console.log('');

    console.log('🏗️  Aplicando migraciones Prisma...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    });
    console.log('✅ Migraciones aplicadas correctamente');
    console.log('');

    const tables = await prisma.$queryRawUnsafe(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📋 Tablas disponibles:');
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${table.tablename}`);
    });
    console.log('');
    console.log(`   Total: ${tables.length} tablas`);

    console.log('');
    console.log('======================================');
    console.log('✅ INICIALIZACIÓN COMPLETA');
    console.log('======================================');
    console.log('');
    console.log('📝 Próximos pasos:');
    console.log('1. Ejecutar seeders para crear Platform Admin:');
    console.log('   node scripts/seed-platform-admin-production.js');
    console.log('');
    console.log('2. Ejecutar seeders para crear Planes:');
    console.log('   node scripts/seed-plans-production.js');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
