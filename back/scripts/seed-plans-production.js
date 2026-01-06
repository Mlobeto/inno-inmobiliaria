/**
 * Script para crear los planes en la base de datos de producción (Neon)
 * 
 * Uso: node scripts/seed-plans-production.js
 * 
 * Este script:
 * 1. Carga variables de entorno desde .env.production
 * 2. Conecta a la base de datos de producción
 * 3. Crea los 3 planes: Basic, Professional, Enterprise
 * 4. Todos los planes tienen 7 días de prueba gratis
 */

require('dotenv').config({ path: '.env.production' });
const { sequelize, Plan } = require('../src/data');

const plans = [
  {
    planId: 'basic',
    name: 'Plan Básico',
    description: 'Perfecto para empezar - 1 usuario',
    priceMonthly: 9900,
    priceYearly: 99000,
    currency: 'ARS',
    features: {
      maxProperties: 50,
      maxClients: 100,
      maxUsers: 1,
      maxStorageGB: 5,
      pdfTemplates: true,
      customTemplates: false,
      whatsappIntegration: false,
      estadisticas: true,
      exportData: true,
      apiAccess: false,
      customDomain: false,
      prioritySupport: false,
      landingPage: false,
      mercadoLibreIntegration: false,
      agentRole: false
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 1
  },
  {
    planId: 'professional',
    name: 'Plan Profesional',
    description: 'Para equipos - Landing + ML + Agentes',
    priceMonthly: 29900,
    priceYearly: 299000,
    currency: 'ARS',
    features: {
      maxProperties: 200,
      maxClients: 500,
      maxUsers: 5,
      maxStorageGB: 20,
      pdfTemplates: true,
      customTemplates: true,
      whatsappIntegration: true,
      estadisticas: true,
      exportData: true,
      apiAccess: true,
      customDomain: false,
      prioritySupport: true,
      landingPage: true,
      mercadoLibreIntegration: true,
      agentRole: true
    },
    trialDays: 7,
    isActive: true,
    isPopular: true,
    sortOrder: 2
  },
  {
    planId: 'enterprise',
    name: 'Plan Empresarial',
    description: 'Todo ilimitado',
    priceMonthly: 69900,
    priceYearly: 699000,
    currency: 'ARS',
    features: {
      maxProperties: -1,  // ilimitado
      maxClients: -1,     // ilimitado
      maxUsers: 20,
      maxStorageGB: 100,
      pdfTemplates: true,
      customTemplates: true,
      whatsappIntegration: true,
      estadisticas: true,
      exportData: true,
      apiAccess: true,
      customDomain: true,
      prioritySupport: true,
      landingPage: true,
      mercadoLibreIntegration: true,
      agentRole: true
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 3
  }
];

async function seedPlans() {
  try {
    console.log('\n🚀 Iniciando creación de planes...\n');
    console.log('📊 Configuración:');
    console.log(`   - Base de datos: ${process.env.DB_NAME}`);
    console.log(`   - Host: ${process.env.DB_HOST}`);
    console.log(`   - Usuario: ${process.env.DB_USER}\n`);

    // Conectar a la base de datos
    console.log('🔌 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa\n');

    // Verificar que existe la tabla plans
    const [tables] = await sequelize.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans'"
    );

    if (tables.length === 0) {
      console.error('❌ ERROR: La tabla "plans" no existe.');
      console.error('   Por favor ejecuta primero: node scripts/init-production-tables.js');
      process.exit(1);
    }

    console.log('📝 Creando planes...\n');

    for (const planData of plans) {
      try {
        const [plan, created] = await Plan.findOrCreate({
          where: { planId: planData.planId },
          defaults: planData
        });

        if (created) {
          console.log(`   ✅ Plan "${plan.name}" creado`);
          console.log(`      - ID: ${plan.planId}`);
          console.log(`      - Precio mensual: $${plan.priceMonthly / 100} ARS`);
          console.log(`      - Días de prueba: ${plan.trialDays}`);
          console.log(`      - Popular: ${plan.isPopular ? 'Sí' : 'No'}\n`);
        } else {
          // Actualizar si ya existe
          await plan.update(planData);
          console.log(`   🔄 Plan "${plan.name}" actualizado\n`);
        }
      } catch (error) {
        console.error(`   ❌ Error creando plan ${planData.name}:`, error.message);
      }
    }

    // Mostrar resumen
    console.log('\n📊 Resumen de planes en base de datos:\n');
    const allPlans = await Plan.findAll({
      order: [['sortOrder', 'ASC']]
    });

    console.table(
      allPlans.map(p => ({
        ID: p.planId,
        Nombre: p.name,
        'Precio/mes': `$${p.priceMonthly / 100}`,
        'Precio/año': `$${p.priceYearly / 100}`,
        'Trial (días)': p.trialDays,
        Activo: p.isActive ? '✅' : '❌',
        Popular: p.isPopular ? '⭐' : '-'
      }))
    );

    console.log('\n✅ Proceso completado exitosamente');
    console.log('\n📌 Próximos pasos:');
    console.log('   1. Ejecutar: node scripts/seed-platform-admin-production.js');
    console.log('   2. Verificar en frontend que aparecen los planes');
    console.log('   3. Registrar primer tenant de prueba\n');

  } catch (error) {
    console.error('\n❌ Error durante la creación de planes:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Conexión cerrada\n');
  }
}

// Ejecutar
seedPlans();
