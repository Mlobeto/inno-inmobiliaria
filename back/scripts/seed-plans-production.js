require('dotenv').config({ path: '.env.production' });
const prisma = require('../src/utils/prismaClient');

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
      agentRole: false,
      leads: false,
      loteos: false,
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 1,
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
      agentRole: true,
      leads: false,
      loteos: false,
    },
    trialDays: 7,
    isActive: true,
    isPopular: true,
    sortOrder: 2,
  },
  {
    planId: 'enterprise',
    name: 'Plan Empresarial',
    description: 'Todo ilimitado — dominio propio',
    priceMonthly: 69900,
    priceYearly: 699000,
    currency: 'ARS',
    features: {
      maxProperties: -1,
      maxClients: -1,
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
      agentRole: true,
      electronicInvoicing: true,
      leads: false,
      loteos: false,
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 3,
  },
  {
    planId: 'agencia',
    name: 'Plan Agencia',
    description: 'Todo ilimitado + CRM Leads + Gestión de Loteos',
    priceMonthly: 129900,
    priceYearly: 1299000,
    currency: 'ARS',
    features: {
      maxProperties: -1,
      maxClients: -1,
      maxUsers: 50,
      maxStorageGB: 200,
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
      agentRole: true,
      electronicInvoicing: true,
      leads: true,
      loteos: true,
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
  {
    planId: 'lifetime',
    name: 'Plan Lifetime',
    description: 'Acceso permanente — pago único',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'ARS',
    features: {
      maxProperties: -1,
      maxClients: -1,
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
      agentRole: true,
      electronicInvoicing: true,
      leads: true,
      loteos: true,
    },
    trialDays: 0,
    isActive: true,
    isPopular: false,
    sortOrder: 5,
  },
];

async function seedPlans() {
  try {
    console.log('\n🚀 Iniciando creación de planes...\n');

    const tables = await prisma.$queryRawUnsafe(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'plans'"
    );

    if (!tables.length) {
      console.error('❌ ERROR: La tabla "plans" no existe.');
      process.exit(1);
    }

    for (const planData of plans) {
      const existing = await prisma.plans.findUnique({ where: { planId: planData.planId } });

      if (existing) {
        await prisma.plans.update({
          where: { planId: planData.planId },
          data: planData,
        });
        console.log(`🔄 Plan "${planData.name}" actualizado`);
      } else {
        await prisma.plans.create({ data: planData });
        console.log(`✅ Plan "${planData.name}" creado`);
      }
    }

    const allPlans = await prisma.plans.findMany({ orderBy: { sortOrder: 'asc' } });

    console.table(
      allPlans.map((p) => ({
        ID: p.planId,
        Nombre: p.name,
        'Precio/mes': `$${Number(p.priceMonthly) / 100}`,
        'Precio/año': `$${Number(p.priceYearly || 0) / 100}`,
        'Trial (días)': p.trialDays,
        Activo: p.isActive ? '✅' : '❌',
        Popular: p.isPopular ? '⭐' : '-',
      }))
    );

    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('\n❌ Error durante la creación de planes:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión cerrada\n');
  }
}

seedPlans();
