/**
 * seed-modules.js
 * Crea/actualiza el plan base y el catálogo de módulos add-on.
 * Ejecutar: node back/scripts/seed-modules.js
 */

const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

const prisma = require('../src/utils/prismaClient');
const { refreshLifetimePlanFeatures } = require('../src/controllers/ModuleAdminController');

async function main() {
  console.log('🌱 Seeding plan base y módulos...');

  // ── Plan base ──────────────────────────────────────────────
  await prisma.plans.upsert({
    where: { planId: 'base' },
    update: {
      name: 'Plan Base',
      description: 'Gestión completa de alquileres y ventas: propiedades, contratos, cuotas, recibos y balance.',
      priceMonthly: 10000,
      currency: 'ARS',
      trialDays: 7,
      isActive: true,
      isPopular: false,
      sortOrder: 0,
      features: {
        properties: true,
        rentals: true,
        sales: true,
        clients: true,
        contracts: true,
        receipts: true,
        balance: true,
        pdfTemplates: true,
        estadisticas: true,
        exportData: true,
        maxProperties: -1,
        maxClients: -1,
        maxUsers: 2,
      },
    },
    create: {
      planId: 'base',
      name: 'Plan Base',
      description: 'Gestión completa de alquileres y ventas: propiedades, contratos, cuotas, recibos y balance.',
      priceMonthly: 10000,
      currency: 'ARS',
      trialDays: 7,
      isActive: true,
      isPopular: false,
      sortOrder: 0,
      features: {
        properties: true,
        rentals: true,
        sales: true,
        clients: true,
        contracts: true,
        receipts: true,
        balance: true,
        pdfTemplates: true,
        estadisticas: true,
        exportData: true,
        maxProperties: -1,
        maxClients: -1,
        maxUsers: 2,
      },
    },
  });
  console.log('  ✅ Plan base creado/actualizado');

  // Plan lifetime: todos los módulos (solo asignación manual, no visible en front público)
  await refreshLifetimePlanFeatures();
  console.log('  ✅ Plan lifetime sincronizado con todos los módulos');

  // Desactivar planes viejos
  await prisma.plans.updateMany({
    where: { planId: { notIn: ['base', 'lifetime'] } },
    data: { isActive: false },
  });
  console.log('  ✅ Planes legacy desactivados');

  // ── Módulos add-on ─────────────────────────────────────────
  const modules = [
    {
      moduleId: 'temporary_rentals',
      name: 'Alquileres Temporales',
      description: 'Gestioná propiedades por temporada o corta estadía con reservas, check-in/out y calendario de disponibilidad.',
      price: 15000,
      featureKeys: ['temporaryRentals'],
      question: '¿Gestionás alquileres por temporada o corta estadía?',
      icon: 'calendar',
      sortOrder: 1,
    },
    {
      moduleId: 'landing',
      name: 'Web Propia',
      description: 'Publicá tus propiedades en tu propia landing page personalizada con el nombre de tu inmobiliaria.',
      price: 7000,
      featureKeys: ['landingPage'],
      question: '¿Querés publicar tus propiedades en tu propia web?',
      icon: 'globe',
      sortOrder: 2,
    },
    {
      moduleId: 'leads_team',
      name: 'Leads y Equipo',
      description: 'Capturá leads desde tu web y MercadoLibre, asignalos a agentes y gestioná tu equipo de trabajo.',
      price: 5000,
      featureKeys: ['leads', 'agentRole'],
      question: '¿Trabajás con agentes o querés capturar leads de clientes interesados?',
      icon: 'users',
      sortOrder: 3,
    },
    {
      moduleId: 'mercadolibre',
      name: 'Integración MercadoLibre',
      description: 'Sincronizá tus propiedades con tu cuenta de vendedor en MercadoLibre Inmuebles.',
      price: 11000,
      featureKeys: ['mercadoLibreIntegration'],
      question: '¿Tenés cuenta de vendedor en MercadoLibre Inmuebles?',
      icon: 'shopping-cart',
      sortOrder: 4,
    },
    {
      moduleId: 'loteos',
      name: 'Gestión de Loteos',
      description: 'Administrá loteos con planos interactivos, ventas en cuotas y seguimiento de pagos por lote.',
      price: 25000,
      featureKeys: ['loteos'],
      question: '¿Vendés o administrás loteos?',
      icon: 'map',
      sortOrder: 5,
    },
    {
      moduleId: 'portal_inquilino',
      name: 'Portal Inquilino',
      description: 'Tus inquilinos pueden ver sus cuotas, subir comprobantes de pago y acceder a sus recibos online.',
      price: 5000,
      featureKeys: ['portalInquilino'],
      question: '¿Querés que tus inquilinos gestionen sus pagos online?',
      icon: 'home',
      sortOrder: 6,
    },
    {
      moduleId: 'electronic_invoicing',
      name: 'Facturación Electrónica ARCA',
      description: 'Emití facturas electrónicas con AFIP/ARCA desde el sistema: comprobantes A, B, C y notas de crédito.',
      price: 7000,
      featureKeys: ['electronic_invoicing', 'electronicInvoicing'],
      question: '¿Necesitás emitir facturas electrónicas con AFIP/ARCA?',
      icon: 'receipt',
      sortOrder: 7,
    },
  ];

  for (const mod of modules) {
    await prisma.modules.upsert({
      where: { moduleId: mod.moduleId },
      update: {
        name: mod.name,
        description: mod.description,
        price: mod.price,
        featureKeys: mod.featureKeys,
        question: mod.question,
        icon: mod.icon,
        sortOrder: mod.sortOrder,
        isActive: true,
      },
      create: {
        ...mod,
        currency: 'ARS',
        isActive: true,
      },
    });
    console.log(`  ✅ Módulo "${mod.name}" ($${mod.price.toLocaleString('es-AR')}/mes)`);
  }

  console.log('\n✨ Seed completado.');
  console.log('   Plan base: $10.000/mes (7 días gratis)');
  console.log('   Módulos disponibles:', modules.length);
  console.log('   Máximo posible: $' + (10000 + modules.reduce((s, m) => s + m.price, 0)).toLocaleString('es-AR') + '/mes');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
