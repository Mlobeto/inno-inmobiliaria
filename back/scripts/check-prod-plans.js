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

async function main() {
  const HOST = 'inno-prod-api.proudmoss-fef6994b.eastus2.azurecontainerapps.io';

  console.log('1️⃣  Login...');
  const loginBody = JSON.stringify({ username: 'platform_admin', password: process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeMe123!' });
  const loginRes = await request({
    hostname: HOST,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginBody) },
  }, loginBody);

  console.log('Login response:', JSON.stringify(loginRes, null, 2));
  if (!loginRes.token) {
    console.error('❌ Login fallido');
    process.exit(1);
  }
  console.log('✅ Login OK, role:', loginRes.admin?.role);

  console.log('\n2️⃣  Consultando /platform-admin/plans...');
  const plansRes = await request({
    hostname: HOST,
    path: '/api/platform-admin/plans',
    method: 'GET',
    headers: { Authorization: `Bearer ${loginRes.token}` },
  });

  console.log('\n3️⃣  Creando/actualizando Plan Agencia...');
  const agenciaBody = JSON.stringify({
    planId: 'agencia',
    name: 'Plan Agencia',
    description: 'Todo ilimitado + CRM Leads + Gestión de Loteos',
    priceMonthly: 129900,
    priceYearly: 1299000,
    currency: 'ARS',
    features: {
      maxProperties: -1, maxClients: -1, maxUsers: 50, maxStorageGB: 200,
      pdfTemplates: true, customTemplates: true, whatsappIntegration: true,
      estadisticas: true, exportData: true, apiAccess: true, customDomain: true,
      prioritySupport: true, landingPage: true, mercadoLibreIntegration: true,
      agentRole: true, electronicInvoicing: true, leads: true, loteos: true,
    },
    trialDays: 7,
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  });
  const createRes = await request({
    hostname: HOST,
    path: '/api/platform-admin/plans',
    method: 'POST',
    headers: { Authorization: `Bearer ${loginRes.token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(agenciaBody) },
  }, agenciaBody);
  console.log('Resultado:', JSON.stringify(createRes, null, 2));

  console.log('\n5️⃣  Corrigiendo sortOrder de Lifetime a 5...');
  const lifetimeBody = JSON.stringify({ sortOrder: 5 });
  const updateRes = await request({
    hostname: HOST,
    path: '/api/platform-admin/plans/lifetime',
    method: 'PUT',
    headers: { Authorization: `Bearer ${loginRes.token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(lifetimeBody) },
  }, lifetimeBody);
  console.log('Resultado:', updateRes.success ? '✅ OK' : JSON.stringify(updateRes));

  console.log('\n6️⃣  Planes finales:');
  const finalPlans = await request({
    hostname: HOST,
    path: '/api/platform-admin/plans',
    method: 'GET',
    headers: { Authorization: `Bearer ${loginRes.token}` },
  });
  console.log('Total planes:', finalPlans.count);
  if (finalPlans.plans) {
    finalPlans.plans.forEach(p => console.log(`  - ${p.planId}: ${p.name} (sortOrder: ${p.sortOrder})`));
  }
}

main().catch(console.error);
