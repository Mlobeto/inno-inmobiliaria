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
    
    // Importar todos los modelos para asegurar el orden correcto
    const {
      Tenant,
      Admin,
      Plan,
      Subscription,
      Client,
      ClientDocument,
      Property,
      Lease,
      PaymentReceipt,
      SaleContract,
      Garantor,
      PdfTemplate,
      Commission,
      RentUpdate,
      ClientProperty
    } = require('../src/data');

    // Crear tablas en orden de dependencias
    console.log('   1. Creando Tenants...');
    await Tenant.sync({ alter: false });
    
    console.log('   2. Creando Plans...');
    await Plan.sync({ alter: false });
    
    console.log('   3. Creando Admins...');
    await Admin.sync({ alter: false });
    
    console.log('   4. Creando AdminSettings...');
    // AdminSettings tiene un problema de tipo de dato con tenantId
    // Lo creamos sin foreign key constraint
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS admin_settings (
          id SERIAL PRIMARY KEY,
          company_name VARCHAR(255),
          company_address VARCHAR(255),
          company_city VARCHAR(255),
          company_province VARCHAR(255),
          company_phone VARCHAR(255),
          company_email VARCHAR(255),
          company_registration VARCHAR(255),
          company_cuit VARCHAR(255),
          company_ingresos_brutos VARCHAR(255),
          company_condicion_iva VARCHAR(255) DEFAULT 'RESPONSABLE MONOTRIBUTO',
          company_inicio_actividad VARCHAR(255),
          professional_title VARCHAR(255),
          company_logo_url VARCHAR(255),
          receipt_prefix VARCHAR(1) DEFAULT 'X',
          receipt_footer_text TEXT,
          contract_footer_text TEXT,
          tenant_id INTEGER,
          additional_config JSONB DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.log('   ⚠️  AdminSettings ya existe o error:', error.message);
    }
    
    console.log('   5. Creando Subscriptions...');
    await Subscription.sync({ alter: false });
    
    console.log('   6. Creando Clients...');
    await Client.sync({ alter: false });
    
    console.log('   7. Creando ClientDocuments...');
    await ClientDocument.sync({ alter: false });
    
    console.log('   8. Creando Properties...');
    await Property.sync({ alter: false });
    
    console.log('   9. Creando Leases...');
    await Lease.sync({ alter: false });
    
    console.log('   10. Creando PaymentReceipts...');
    await PaymentReceipt.sync({ alter: false });
    
    console.log('   11. Creando SaleContracts...');
    await SaleContract.sync({ alter: false });
    
    console.log('   12. Creando Garantors...');
    await Garantor.sync({ alter: false });
    
    console.log('   13. Creando PdfTemplates...');
    await PdfTemplate.sync({ alter: false });
    
    console.log('   14. Creando Commissions...');
    await Commission.sync({ alter: false });
    
    console.log('   15. Creando RentUpdates...');
    await RentUpdate.sync({ alter: false });
    
    console.log('   16. Creando ClientProperty...');
    await ClientProperty.sync({ alter: false });
    
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
