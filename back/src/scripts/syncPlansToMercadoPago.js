/**
 * Script para sincronizar planes de la base de datos con MercadoPago
 * Crea los planes como "preapproval_plan" en MercadoPago
 * 
 * Ejecutar: node src/scripts/syncPlansToMercadoPago.js
 */

require('dotenv').config();
const prisma = require('../utils/prismaClient');
const { MercadoPagoConfig, PreApprovalPlan } = require('mercadopago');

// Configurar cliente de MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preApprovalPlanClient = new PreApprovalPlan(client);

async function syncPlans() {
  try {
    console.log('🔄 Iniciando sincronización de planes con MercadoPago...\n');

    await prisma.$connect();
    console.log('✅ Conexión a BD establecida\n');

    // Obtener todos los planes activos de la BD
    const plans = await prisma.plans.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });

    console.log(`📋 Encontrados ${plans.length} planes en la base de datos\n`);

    for (const plan of plans) {
      try {
        console.log(`\n🔹 Procesando plan: ${plan.name} (${plan.planId})`);

        // Saltar planes gratuitos (MercadoPago no permite suscripciones con precio 0)
        if (parseFloat(plan.priceMonthly) === 0) {
          console.log(`   ⏭️  Plan gratuito, no requiere sincronización con MercadoPago`);
          console.log(`   ℹ️  Los usuarios pueden activar este plan directamente con startTrial()`);
          continue;
        }

        // Si ya tiene mpPlanId, verificar si existe en MercadoPago
        if (plan.mpPlanId) {
          console.log(`   ℹ️  Plan ya tiene ID de MercadoPago: ${plan.mpPlanId}`);
          
          try {
            const existingPlan = await preApprovalPlanClient.get({ id: plan.mpPlanId });
            console.log(`   ✅ Plan existe en MercadoPago (estado: ${existingPlan.status})`);
            continue;
          } catch (error) {
            console.log(`   ⚠️  Plan no encontrado en MercadoPago, creando nuevo...`);
          }
        }

        // Crear plan en MercadoPago
        const mpPlanData = {
          reason: plan.name,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: parseFloat(plan.priceMonthly),
            currency_id: plan.currency || 'ARS',
            free_trial: plan.trialDays > 0 ? {
              frequency: plan.trialDays,
              frequency_type: 'days'
            } : undefined
          },
          payment_methods_allowed: {
            payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' }
            ]
          },
          back_url: 'https://www.mercadopago.com.ar'
        };

        console.log(`   📤 Creando plan en MercadoPago...`);
        const response = await preApprovalPlanClient.create({ body: mpPlanData });

        // Actualizar plan en BD con el ID de MercadoPago
        await prisma.plans.update({
          where: { planId: plan.planId },
          data: { mpPlanId: response.id },
        });

        console.log(`   ✅ Plan creado exitosamente en MercadoPago`);
        console.log(`      - MP Plan ID: ${response.id}`);
        console.log(`      - Precio: ${plan.currency} ${plan.priceMonthly}/mes`);
        console.log(`      - Trial: ${plan.trialDays} días`);

      } catch (error) {
        console.error(`   ❌ Error procesando plan ${plan.planId}:`, error.message);
        if (error.cause) {
          console.error('      Detalles:', error.cause);
        }
      }
    }

    console.log('\n\n✅ Sincronización completada!\n');
    console.log('📝 Resumen:');
    
    // Contar planes con precio > 0 que tienen mpPlanId
    const plansWithMpId = await prisma.plans.count({ 
      where: { 
        isActive: true,
        mpPlanId: { not: null },
        priceMonthly: { gt: 0 }
      } 
    });
    
    // Contar total de planes de pago (precio > 0)
    const paidPlans = await prisma.plans.count({
      where: {
        isActive: true,
        priceMonthly: { gt: 0 }
      }
    });
    
    console.log(`   - Planes de pago sincronizados: ${plansWithMpId}/${paidPlans}`);
    console.log(`   - Planes gratuitos (no requieren MercadoPago): ${plans.length - paidPlans}`);
    
    if (plansWithMpId < paidPlans) {
      console.log(`   ⚠️  Algunos planes de pago no pudieron sincronizarse`);
    }

  } catch (error) {
    console.error('\n❌ Error en la sincronización:', error);
  } finally {
    await prisma.$disconnect();
    process.exit();
  }
}

// Verificar credenciales antes de ejecutar
if (!process.env.MP_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN.includes('your_mercadopago')) {
  console.error('\n❌ ERROR: No se encontraron credenciales de MercadoPago válidas');
  console.error('   Por favor configura MP_ACCESS_TOKEN en el archivo .env\n');
  process.exit(1);
}

// Ejecutar sincronización
syncPlans();
