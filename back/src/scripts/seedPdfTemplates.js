const fs = require('fs').promises;
const path = require('path');
const prisma = require('../utils/prismaClient');

/**
 * Script para insertar templates PDF por defecto en todos los tenants
 * Ejecutar: node src/scripts/seedPdfTemplates.js
 */

const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'pdf');

const TEMPLATE_DEFINITIONS = [
  {
    templateType: 'CONTRATO_ALQUILER',
    templateName: 'Contrato de Alquiler Estándar',
    fileName: 'contrato-alquiler.html',
    variables: {
      lease: { startDate: 'Fecha de inicio', rentAmount: 'Monto mensual', totalMonths: 'Duración en meses', updateFrequency: 'Frecuencia de actualización' },
      property: { address: 'Dirección', city: 'Ciudad', typeProperty: 'Tipo de propiedad' },
      tenant: { name: 'Nombre inquilino', cuil: 'CUIL', direccion: 'Domicilio' },
      landlord: { name: 'Nombre propietario', cuil: 'CUIL', direccion: 'Domicilio' },
      guarantors: 'Array de garantes (opcional)',
      inmobiliaria: { businessName: 'Nombre inmobiliaria', cuit: 'CUIT', signatureUrl: 'Firma' }
    },
    pageSize: 'A4',
    orientation: 'portrait',
    isDefault: true,
  },
  {
    templateType: 'AUTORIZACION_VENTA',
    templateName: 'Autorización de Venta Estándar',
    fileName: 'autorizacion-venta.html',
    variables: {
      client: { name: 'Nombre propietario', cuil: 'CUIL' },
      property: { description: 'Descripción', city: 'Ciudad', price: 'Precio', comision: 'Comisión %', address: 'Dirección', socio: 'Socio (opcional)' },
      inmobiliaria: { businessName: 'Nombre inmobiliaria', phone: 'Teléfono', address: 'Dirección', signatureUrl: 'Firma' },
      fechaActual: 'Fecha actual'
    },
    pageSize: 'A4',
    orientation: 'portrait',
    isDefault: true,
  },
  {
    templateType: 'RECIBO_PAGO',
    templateName: 'Recibo de Pago Oficial',
    fileName: 'recibo-pago.html',
    variables: {
      payment: { id: 'Número recibo', amount: 'Monto', paymentDate: 'Fecha de pago', type: 'Tipo (initial/commission/cuota)', period: 'Período', installmentNumber: 'Número cuota' },
      tenant: { name: 'Nombre inquilino', phone: 'Teléfono', direccion: 'Domicilio', ciudad: 'Ciudad', provincia: 'Provincia' },
      property: { address: 'Dirección propiedad' },
      lease: { totalMonths: 'Total meses contrato' },
      inmobiliaria: { signatureUrl: 'Firma digital' }
    },
    pageSize: 'A4',
    orientation: 'portrait',
    isDefault: true,
  },
  {
    templateType: 'FICHA_PROPIEDAD',
    templateName: 'Ficha de Propiedad',
    fileName: 'ficha-propiedad.html',
    variables: {
      property: { 
        address: 'Dirección', 
        neighborhood: 'Barrio', 
        city: 'Ciudad', 
        price: 'Precio', 
        type: 'Tipo (venta/alquiler)', 
        typeProperty: 'Tipo propiedad', 
        rooms: 'Habitaciones', 
        bathrooms: 'Baños',
        superficieCubierta: 'Superficie cubierta',
        superficieTotal: 'Superficie total',
        description: 'Descripción',
        highlights: 'Destacados',
        images: 'Array de imágenes'
      },
      inmobiliaria: { businessName: 'Nombre inmobiliaria', logoUrl: 'Logo', address: 'Dirección', phone: 'Teléfono' }
    },
    pageSize: 'A4',
    orientation: 'portrait',
    isDefault: true,
  },
  {
    templateType: 'ACTUALIZACION_RENTA',
    templateName: 'Actualización de Renta',
    fileName: 'actualizacion-renta.html',
    variables: {
      lease: { rentAmount: 'Monto anterior', startDate: 'Fecha inicio contrato', updateFrequency: 'Frecuencia actualización' },
      property: { address: 'Dirección', city: 'Ciudad' },
      tenant: { name: 'Nombre inquilino', cuil: 'CUIL' },
      landlord: { name: 'Nombre propietario', cuil: 'CUIL' },
      newRentAmount: 'Nuevo monto (pasado en customVariables)',
      updateDate: 'Fecha actualización (pasado en customVariables)',
      porcentajeAumento: 'Porcentaje de aumento (calculado en customVariables)',
      periodo: 'Período (calculado en customVariables)',
      ipcIndex: 'Índice IPC (opcional)',
      inmobiliaria: { businessName: 'Nombre inmobiliaria', cuit: 'CUIT', signatureUrl: 'Firma' }
    },
    pageSize: 'A4',
    orientation: 'portrait',
    isDefault: true,
  },
];

/**
 * Lee el contenido de un template HTML
 */
async function readTemplate(fileName) {
  const filePath = path.join(TEMPLATES_DIR, fileName);
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

/**
 * Crea templates por defecto para un tenant
 */
async function createDefaultTemplatesForTenant(tenantId, adminId = null) {
  console.log(`\n📄 Creando templates por defecto para tenant ${tenantId}...`);
  
  for (const templateDef of TEMPLATE_DEFINITIONS) {
    try {
      // Verificar si ya existe un template de este tipo para el tenant
      const existing = await prisma.pdf_templates.findFirst({
        where: {
          tenantId,
          templateType: templateDef.templateType,
        },
      });

      if (existing) {
        console.log(`   ⏭️  ${templateDef.templateType} ya existe, saltando...`);
        continue;
      }

      // Leer el contenido del template HTML
      const htmlTemplate = await readTemplate(templateDef.fileName);

      // Crear el template
      await prisma.pdf_templates.create({
        data: {
          tenantId,
          templateType: templateDef.templateType,
          templateName: templateDef.templateName,
          htmlTemplate,
          styles: '',
          headerHtml: '',
          footerHtml: '',
          variables: templateDef.variables,
          pageSize: templateDef.pageSize,
          orientation: templateDef.orientation,
          isDefault: templateDef.isDefault,
          isActive: true,
          createdBy: adminId,
        },
      });

      console.log(`   ✅ ${templateDef.templateType} creado exitosamente`);
    } catch (error) {
      console.error(`   ❌ Error creando ${templateDef.templateType}:`, error.message);
    }
  }
}

/**
 * Crea templates para todos los tenants existentes
 */
async function seedAllTenants() {
  try {
    console.log('🚀 Iniciando seed de templates PDF...\n');

    // Obtener todos los tenants activos
    const tenants = await prisma.tenants.findMany({
      where: {
        status: { in: ['TRIAL', 'ACTIVE', 'active'] },
      },
    });

    if (tenants.length === 0) {
      console.log('⚠️  No se encontraron tenants activos.');
      return;
    }

    console.log(`📊 Se encontraron ${tenants.length} tenant(s) activo(s)`);

    // Crear templates para cada tenant
    for (const tenant of tenants) {
      await createDefaultTemplatesForTenant(tenant.tenantId);
    }

    console.log('\n✅ Seed completado exitosamente!');
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

/**
 * Crea templates solo para un tenant específico
 */
async function seedSpecificTenant(tenantId) {
  try {
    console.log(`🚀 Creando templates para tenant ${tenantId}...\n`);

    const tenant = await prisma.tenants.findUnique({ where: { tenantId: parseInt(tenantId, 10) } });
    
    if (!tenant) {
      console.error(`❌ Tenant ${tenantId} no encontrado`);
      return;
    }

    await createDefaultTemplatesForTenant(tenantId);
    
    console.log('\n✅ Templates creados exitosamente!');
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Ejecutar el script
if (require.main === module) {
  const args = process.argv.slice(2);
  const tenantId = args[0] ? parseInt(args[0]) : null;

  if (tenantId) {
    // Seed para un tenant específico
    seedSpecificTenant(tenantId)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    // Seed para todos los tenants
    seedAllTenants()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

module.exports = {
  seedAllTenants,
  seedSpecificTenant,
  createDefaultTemplatesForTenant,
};
