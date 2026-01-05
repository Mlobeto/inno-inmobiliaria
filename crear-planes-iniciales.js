// Script para crear los planes iniciales en InnoInmo
// Ejecutar desde Insomnia o como requests individuales

const API_BASE = 'http://localhost:3001/api/platform-admin';
const TOKEN = 'TU_TOKEN_AQUI'; // Reemplazar con el token de platform_admin

const planes = [
  {
    "planId": "trial",
    "name": "Trial Gratuito",
    "description": "Prueba gratuita por 7 días con acceso completo a todas las funcionalidades",
    "priceMonthly": 0,
    "priceYearly": 0,
    "currency": "ARS",
    "features": {
      "maxProperties": 10,
      "maxClients": 20,
      "maxUsers": 1,
      "maxStorageGB": 1,
      "pdfPropiedades": true,
      "editorContratos": true,
      "whatsappTemplates": true,
      "seguimientoPagos": true,
      "actualizacionAlquileres": true,
      "autorizacionVentas": true,
      "estadisticas": false,
      "exportData": false,
      "mercadoLibreIntegration": false,
      "soportePrioritario": false
    },
    "trialDays": 7,
    "isActive": true,
    "isPopular": false,
    "sortOrder": 1
  },
  {
    "planId": "starter",
    "name": "Starter",
    "description": "Ideal para inmobiliarias pequeñas que empiezan. Hasta 50 propiedades.",
    "priceMonthly": 15000,
    "priceYearly": 150000,
    "currency": "ARS",
    "features": {
      "maxProperties": 50,
      "maxClients": 100,
      "maxUsers": 2,
      "maxStorageGB": 5,
      "pdfPropiedades": true,
      "editorContratos": true,
      "whatsappTemplates": true,
      "seguimientoPagos": true,
      "actualizacionAlquileres": true,
      "autorizacionVentas": true,
      "estadisticas": false,
      "exportData": false,
      "mercadoLibreIntegration": false,
      "soportePrioritario": false
    },
    "trialDays": 0,
    "isActive": true,
    "isPopular": false,
    "sortOrder": 2
  },
  {
    "planId": "basic",
    "name": "Basic",
    "description": "Para inmobiliarias establecidas. Hasta 100 propiedades.",
    "priceMonthly": 25000,
    "priceYearly": 250000,
    "currency": "ARS",
    "features": {
      "maxProperties": 100,
      "maxClients": 200,
      "maxUsers": 3,
      "maxStorageGB": 10,
      "pdfPropiedades": true,
      "editorContratos": true,
      "whatsappTemplates": true,
      "seguimientoPagos": true,
      "actualizacionAlquileres": true,
      "autorizacionVentas": true,
      "estadisticas": false,
      "exportData": false,
      "mercadoLibreIntegration": false,
      "soportePrioritario": false
    },
    "trialDays": 0,
    "isActive": true,
    "isPopular": false,
    "sortOrder": 3
  },
  {
    "planId": "professional",
    "name": "Professional",
    "description": "Para inmobiliarias en crecimiento con múltiples agentes. Hasta 250 propiedades.",
    "priceMonthly": 45000,
    "priceYearly": 450000,
    "currency": "ARS",
    "features": {
      "maxProperties": 250,
      "maxClients": 500,
      "maxUsers": 5,
      "maxStorageGB": 25,
      "pdfPropiedades": true,
      "editorContratos": true,
      "whatsappTemplates": true,
      "seguimientoPagos": true,
      "actualizacionAlquileres": true,
      "autorizacionVentas": true,
      "estadisticas": true,
      "exportData": true,
      "mercadoLibreIntegration": false,
      "soportePrioritario": false
    },
    "trialDays": 0,
    "isActive": true,
    "isPopular": true,
    "sortOrder": 4
  },
  {
    "planId": "business",
    "name": "Business",
    "description": "Para grandes inmobiliarias. Hasta 500 propiedades con API y soporte prioritario.",
    "priceMonthly": 75000,
    "priceYearly": 750000,
    "currency": "ARS",
    "features": {
      "maxProperties": 500,
      "maxClients": 1000,
      "maxUsers": 10,
      "maxStorageGB": 50,
      "pdfPropiedades": true,
      "editorContratos": true,
      "whatsappTemplates": true,
      "seguimientoPagos": true,
      "actualizacionAlquileres": true,
      "autorizacionVentas": true,
      "estadisticas": true,
      "exportData": true,
      "mercadoLibreIntegration": true,
      "soportePrioritario": true
    },
    "trialDays": 0,
    "isActive": true,
    "isPopular": false,
    "sortOrder": 5
  },
  {
    "planId": "enterprise",
    "name": "Enterprise",
    "description": "Sin límites para grandes redes inmobiliarias. Propiedades, clientes y usuarios ilimitados.",
    "priceMonthly": 150000,
    "priceYearly": 1500000,
    "currency": "ARS",
    "features": {
      "maxProperties": 999999,
      "maxClients": 999999,
      "maxUsers": 999999,
      "maxStorageGB": 999999,
      "pdfPropiedades": true,
      "editorContratos": true,
      "whatsappTemplates": true,
      "seguimientoPagos": true,
      "actualizacionAlquileres": true,
      "autorizacionVentas": true,
      "estadisticas": true,
      "exportData": true,
      "mercadoLibreIntegration": true,
      "soportePrioritario": true
    },
    "trialDays": 0,
    "isActive": true,
    "isPopular": false,
    "sortOrder": 6
  }
];

// Función para crear los planes
async function crearPlanes() {
  console.log('🚀 Iniciando creación de planes...\n');
  
  for (const plan of planes) {
    try {
      const response = await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(plan)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Plan "${plan.name}" creado exitosamente`);
        console.log(`   - Propiedades: ${plan.features.maxProperties}`);
        console.log(`   - Precio mensual: $${plan.priceMonthly.toLocaleString('es-AR')}`);
        console.log(`   - Precio anual: $${plan.priceYearly.toLocaleString('es-AR')}`);
        console.log('');
      } else {
        console.error(`❌ Error al crear plan "${plan.name}": ${result.message}`);
      }
    } catch (error) {
      console.error(`❌ Error de red al crear plan "${plan.name}": ${error.message}`);
    }
  }
  
  console.log('✨ Proceso completado!');
}

// Ejecutar si estás en Node.js
if (typeof window === 'undefined') {
  crearPlanes();
}

// Exportar para usar en otros contextos
module.exports = { planes, crearPlanes };
