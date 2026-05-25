const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const prisma = require('../src/utils/prismaClient');

/** Features base compartidas por todos los planes (módulo operativo core). */
const CORE_ON = {
  pdfTemplates: true,
  customTemplates: true,
  whatsappIntegration: true,
  estadisticas: true,
  exportData: true,
};

/** Features premium desactivadas en Básico. */
const PREMIUM_OFF = {
  landingPage: false,
  portalInquilino: false,
  mercadoLibreIntegration: false,
  agentRole: false,
  electronicInvoicing: false,
  electronic_invoicing: false,
  leads: false,
  loteos: false,
  customDomain: false,
  prioritySupport: false,
  apiAccess: false,
};

const plans = [
  {
    planId: 'basic',
    name: 'Plan Básico',
    description: 'Gestión completa de propiedades, clientes, contratos y cobros — 1 usuario',
    priceMonthly: 9900,
    priceYearly: 99000,
    currency: 'ARS',
    features: {
      maxProperties: 50,
      maxClients: 100,
      maxUsers: 1,
      maxStorageGB: 5,
      ...CORE_ON,
      customTemplates: false,
      whatsappIntegration: false,
      apiAccess: false,
      ...PREMIUM_OFF,
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    planId: 'professional',
    name: 'Plan Profesional',
    description: 'Básico + Mercado Libre, CRM Leads, página web y portal de inquilinos',
    priceMonthly: 29900,
    priceYearly: 299000,
    currency: 'ARS',
    features: {
      maxProperties: 200,
      maxClients: 500,
      maxUsers: 5,
      maxStorageGB: 20,
      ...CORE_ON,
      apiAccess: true,
      prioritySupport: true,
      landingPage: true,
      portalInquilino: true,
      mercadoLibreIntegration: true,
      leads: true,
      agentRole: false,
      electronicInvoicing: false,
      electronic_invoicing: false,
      loteos: false,
      customDomain: false,
    },
    trialDays: 7,
    isActive: true,
    isPopular: true,
    sortOrder: 2,
  },
  {
    planId: 'gestpro',
    name: 'Plan GestPRO',
    description: 'Todo Profesional + agentes y comisiones, facturación ARCA/AFIP y loteos',
    priceMonthly: 99900,
    priceYearly: 999000,
    currency: 'ARS',
    features: {
      maxProperties: -1,
      maxClients: -1,
      maxUsers: 20,
      maxStorageGB: 100,
      ...CORE_ON,
      apiAccess: true,
      customDomain: true,
      prioritySupport: true,
      landingPage: true,
      portalInquilino: true,
      mercadoLibreIntegration: true,
      leads: true,
      agentRole: true,
      electronicInvoicing: true,
      electronic_invoicing: true,
      loteos: true,
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 3,
  },
  {
    planId: 'lifetime',
    name: 'Plan Lifetime',
    description: 'Acceso permanente GestPRO — solo asignación manual por Platform Admin',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'ARS',
    features: {
      maxProperties: -1,
      maxClients: -1,
      maxUsers: 20,
      maxStorageGB: 100,
      ...CORE_ON,
      apiAccess: true,
      customDomain: true,
      prioritySupport: true,
      landingPage: true,
      portalInquilino: true,
      mercadoLibreIntegration: true,
      leads: true,
      agentRole: true,
      electronicInvoicing: true,
      electronic_invoicing: true,
      loteos: true,
    },
    trialDays: 0,
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
];

const LEGACY_PLAN_IDS = ['enterprise', 'agencia'];

async function seedPlans() {
  try {
    console.log('\n🚀 Sincronizando planes...\n');

    for (const planData of plans) {
      await prisma.plans.upsert({
        where: { planId: planData.planId },
        update: planData,
        create: planData,
      });
      console.log(`✅ ${planData.name} (${planData.planId})`);
    }

    const deactivated = await prisma.plans.updateMany({
      where: { planId: { in: LEGACY_PLAN_IDS } },
      data: { isActive: false },
    });
    if (deactivated.count > 0) {
      console.log(`\n⏸  Planes legacy desactivados: ${LEGACY_PLAN_IDS.join(', ')}`);
    }

    const allPlans = await prisma.plans.findMany({ orderBy: { sortOrder: 'asc' } });

    console.table(
      allPlans.map((p) => ({
        ID: p.planId,
        Nombre: p.name,
        'Precio/mes': `$${Number(p.priceMonthly) / 100}`,
        Activo: p.isActive ? '✅' : '❌',
        ML: p.features?.mercadoLibreIntegration ? '✅' : '—',
        Leads: p.features?.leads ? '✅' : '—',
        Landing: p.features?.landingPage ? '✅' : '—',
        Portal: p.features?.portalInquilino ? '✅' : '—',
        Agentes: p.features?.agentRole ? '✅' : '—',
        ARCA: p.features?.electronicInvoicing ? '✅' : '—',
        Loteos: p.features?.loteos ? '✅' : '—',
      })),
    );

    console.log('\n✅ Planes sincronizados');
    console.log('   Públicos: basic, professional, gestpro');
    console.log('   Oculto: lifetime (solo Platform Admin)\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedPlans();
