/**
 * Script para inicializar base de datos de producción
 * Ejecutar: node scripts/init-production-tables.js
 */

require('dotenv').config({ path: '.env.production' });
const { sequelize } = require('../src/data');

async function initDatabase() {
  console.log('🚀 Inicializando Base de Datos de Producción');
  console.log('');
  console.log('📊 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Database: ${process.env.DB_NAME}`);
  console.log(`   User: ${process.env.DB_USER}`);
  console.log('');

  try {
    // Probar conexión
    console.log('🔌 Probando conexión...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa');
    console.log('');

    // Sincronizar modelos (crear tablas)
    console.log('🏗️  Creando tablas...');
    
    // alter: true modificará las tablas existentes
    // force: true eliminaría y recrearía (no usar en producción con datos)
    await sequelize.sync({ alter: false, force: false });
    
    console.log('✅ Tablas creadas correctamente');
    console.log('');

    // Obtener lista de tablas creadas
    const [tables] = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    console.log('📋 Tablas creadas:');
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
    console.log('   node scripts/seed-platform-admin.js');
    console.log('');
    console.log('2. Ejecutar seeders para crear Planes:');
    console.log('   node scripts/seed-plans.js');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

initDatabase();
