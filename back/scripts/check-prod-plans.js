require('dotenv').config({ path: '.env.production' });
const https = require('https');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (d) => (data += d));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

const GESTPRO_FEATURES = {
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
  portalInquilino: true,
  mercadoLibreIntegration: true,
  leads: true,
  agentRole: true,
  electronicInvoicing: true,
  electronic_invoicing: true,
  loteos: true,
};

async function main() {
  const HOST = 'inno-prod-api.proudmoss-fef6994b.eastus2.azurecontainerapps.io';

  console.log('1️⃣  Login...');
  const loginBody = JSON.stringify({
    username: 'platform_admin',
    password: process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeMe123!',
  });
  const loginRes = await request({
    hostname: HOST,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) },
  }, loginBody);

  if (!loginRes.token) {
    console.error('❌ Login fallido', loginRes);
    process.exit(1);
  }
  console.log('✅ Login OK');

  const auth = { Authorization: `Bearer ${loginRes.token}` };
  const post = (path, payload) => {
    const body = JSON.stringify(payload);
    return request({
      hostname: HOST,
      path,
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, body);
  };
  const put = (path, payload) => {
    const body = JSON.stringify(payload);
    return request({
      hostname: HOST,
      path,
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, body);
  };

  console.log('\n2️⃣  Plan Básico...');
  console.log(await post('/api/platform-admin/plans', {
    planId: 'basic',
    name: 'Plan Básico',
    description: 'Gestión completa de propiedades, clientes, contratos y cobros — 1 usuario',
    priceMonthly: 9900,
    priceYearly: 99000,
    currency: 'ARS',
    features: {
      maxProperties: 50, maxClients: 100, maxUsers: 1, maxStorageGB: 5,
      pdfTemplates: true, customTemplates: false, whatsappIntegration: false,
      estadisticas: true, exportData: true, apiAccess: false,
      landingPage: false, portalInquilino: false, mercadoLibreIntegration: false,
      agentRole: false, electronicInvoicing: false, electronic_invoicing: false,
      leads: false, loteos: false,
    },
    trialDays: 7, isActive: true, isPopular: false, sortOrder: 1,
  }).then((r) => (r.success || r.planId ? '✅ OK' : JSON.stringify(r))));

  console.log('\n3️⃣  Plan Profesional...');
  console.log(await post('/api/platform-admin/plans', {
    planId: 'professional',
    name: 'Plan Profesional',
    description: 'Básico + Mercado Libre, CRM Leads, landing pública y portal de inquilinos',
    priceMonthly: 29900,
    priceYearly: 299000,
    currency: 'ARS',
    features: {
      maxProperties: 200, maxClients: 500, maxUsers: 5, maxStorageGB: 20,
      pdfTemplates: true, customTemplates: true, whatsappIntegration: true,
      estadisticas: true, exportData: true, apiAccess: true, prioritySupport: true,
      landingPage: true, portalInquilino: true, mercadoLibreIntegration: true, leads: true,
      agentRole: false, electronicInvoicing: false, electronic_invoicing: false, loteos: false,
    },
    trialDays: 7, isActive: true, isPopular: true, sortOrder: 2,
  }).then((r) => (r.success || r.planId ? '✅ OK' : JSON.stringify(r))));

  console.log('\n4️⃣  Plan GestPRO...');
  console.log(await post('/api/platform-admin/plans', {
    planId: 'gestpro',
    name: 'Plan GestPRO',
    description: 'Todo Profesional + agentes y comisiones, facturación ARCA/AFIP y loteos',
    priceMonthly: 99900,
    priceYearly: 999000,
    currency: 'ARS',
    features: GESTPRO_FEATURES,
    trialDays: 7, isActive: true, isPopular: false, sortOrder: 3,
  }).then((r) => (r.success || r.planId ? '✅ OK' : JSON.stringify(r))));

  console.log('\n5️⃣  Plan Lifetime...');
  console.log(await put('/api/platform-admin/plans/lifetime', {
    name: 'Plan Lifetime',
    description: 'Acceso permanente GestPRO — solo asignación manual por Platform Admin',
    features: GESTPRO_FEATURES,
    sortOrder: 4,
    isActive: true,
  }).then((r) => (r.success ? '✅ OK' : JSON.stringify(r))));

  console.log('\n6️⃣  Desactivar legacy enterprise/agencia...');
  for (const id of ['enterprise', 'agencia']) {
    const r = await put(`/api/platform-admin/plans/${id}`, { isActive: false });
    console.log(`  ${id}:`, r.success ? '✅ desactivado' : JSON.stringify(r));
  }

  console.log('\n7️⃣  Planes finales:');
  const finalPlans = await request({
    hostname: HOST,
    path: '/api/platform-admin/plans',
    method: 'GET',
    headers: auth,
  });
  if (finalPlans.plans) {
    finalPlans.plans.forEach((p) => {
      console.log(`  - ${p.planId}: ${p.name} (activo: ${p.isActive}, sort: ${p.sortOrder})`);
    });
  }
}

main().catch(console.error);
