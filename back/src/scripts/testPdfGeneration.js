// Cargar variables de entorno
require('dotenv').config();

const prisma = require('../utils/prismaClient');
const pdfService = require('../services/pdfService');

/**
 * Script de prueba para generar PDFs usando los templates
 * Ejecutar: node src/scripts/testPdfGeneration.js
 */

// Datos de ejemplo para cada tipo de PDF
const MOCK_DATA = {
  CONTRATO_ALQUILER: {
    lease: {
      id: 999,
      startDate: '2025-01-01',
      rentAmount: 250000,
      updateFrequency: 'semestral',
      commission: 5,
      totalMonths: 24,
      inventory: 'Heladera Samsung, Cocina 4 hornallas, Mesa de comedor con 4 sillas, Aire acondicionado split 3500 frigorías',
      status: 'active',
      customContent: 'No se permite la tenencia de mascotas. El locatario se compromete a mantener el jardín en buen estado.',
    },
    property: {
      propertyId: 1,
      address: 'Av. Belgrano 456',
      neighborhood: 'Centro',
      city: 'Belén',
      province: 'Catamarca',
      price: 250000,
      type: 'alquiler',
      typeProperty: 'CASA',
      rooms: 3,
      bathrooms: 2,
      superficieCubierta: 120,
      superficieTotal: 250,
      description: 'Casa amplia con jardín',
      highlights: 'Excelente ubicación, cerca de escuelas y comercios',
      images: [],
    },
    Renter: {
      name: 'Juan Carlos Pérez',
      cuil: '20-12345678-9',
      email: 'jperez@email.com',
      phone: '3835-123456',
      direccion: 'Calle Falsa 123',
      ciudad: 'Belén',
      provincia: 'Catamarca',
    },
    Landlord: {
      name: 'María Laura Gómez',
      cuil: '27-87654321-4',
      email: 'mlgomez@email.com',
      phone: '3835-654321',
      direccion: 'Av. San Martín 789',
      ciudad: 'Belén',
      provincia: 'Catamarca',
    },
    Garantors: [
      {
        name: 'Roberto García',
        cuil: '20-11223344-5',
        email: 'rgarcia@email.com',
        phone: '3835-112233',
        direccion: 'Belgrano 555',
      },
    ],
  },
  AUTORIZACION_VENTA: {
    client: {
      name: 'Ana María Rodríguez',
      cuil: '27-22334455-6',
    },
    property: {
      description: 'Casa de 3 dormitorios, 2 baños, living-comedor, cocina, patio',
      city: 'Belén',
      price: 45000000,
      comision: 3,
      address: 'Lavalle 234',
      socio: 'en condominio con Carlos Rodríguez CUIL 20-33445566-7',
      superficieCubierta: 150,
      superficieTotal: 300,
    },
  },
  RECIBO_PAGO: {
    payment: {
      id: 1001,
      amount: 250000,
      paymentDate: '2025-01-10',
      type: 'cuota',
      period: 'Enero 2025',
      installmentNumber: 1,
    },
    Lease: {
      id: 999,
      totalMonths: 24,
      Renter: {
        name: 'Juan Carlos Pérez',
        cuil: '20-12345678-9',
        phone: '3835-123456',
        direccion: 'Calle Falsa 123',
        ciudad: 'Belén',
        provincia: 'Catamarca',
      },
      Property: {
        address: 'Av. Belgrano 456',
      },
    },
  },
  FICHA_PROPIEDAD: {
    propertyId: 1,
    address: 'Av. Belgrano 456',
    neighborhood: 'Centro',
    city: 'Belén',
    province: 'Catamarca',
    price: 45000000,
    type: 'venta',
    typeProperty: 'Casa',
    rooms: 3,
    bathrooms: 2,
    superficieCubierta: 150,
    superficieTotal: 300,
    description: 'Hermosa casa en el centro de la ciudad, con amplios ambientes, luminosa y bien distribuida. Ideal para familia.',
    highlights: 'Excelente ubicación, cerca de todo, transporte público, escuelas, comercios. Con patio y quincho.',
    images: [
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    ],
  },
  ACTUALIZACION_RENTA: {
    lease: {
      id: 999,
      rentAmount: 250000,
      startDate: '2025-01-01',
      updateFrequency: 'semestral',
      totalMonths: 24,
      Property: {
        address: 'Av. Belgrano 456',
        city: 'Belén',
      },
      Renter: {
        name: 'Juan Carlos Pérez',
        cuil: '20-12345678-9',
      },
      Landlord: {
        name: 'María Laura Gómez',
        cuil: '27-87654321-4',
      },
    },
    customVariables: {
      newRentAmount: 325000,
      updateDate: '2025-07-01',
      porcentajeAumento: '30',
      periodo: 'Primer semestre',
      ipcIndex: '30.5',
    },
  },
};

/**
 * Genera un PDF de prueba para un tipo de template
 */
async function generateTestPdf(templateType) {
  try {
    console.log(`\n📄 Generando PDF de prueba: ${templateType}`);

    // Obtener el template
    const template = await prisma.pdf_templates.findFirst({
      where: {
        tenantId: 1,
        templateType,
        isDefault: true,
      },
    });

    if (!template) {
      console.error(`   ❌ Template ${templateType} no encontrado`);
      return null;
    }

    // Obtener tenant
    const tenant = await prisma.tenants.findUnique({ where: { tenantId: 1 } });
    if (!tenant) {
      console.error('   ❌ Tenant no encontrado');
      return null;
    }

    // Preparar datos según el tipo
    const mockData = MOCK_DATA[templateType];
    const customVariables = mockData.customVariables || {};

    console.log('   ⏳ Renderizando template...');

    // Generar PDF
    const pdfUrl = await pdfService.generatePdf({
      template,
      data: mockData,
      tenant,
      customVariables,
    });

    console.log(`   ✅ PDF generado exitosamente!`);
    console.log(`   🔗 URL: ${pdfUrl}`);

    return pdfUrl;
  } catch (error) {
    console.error(`   ❌ Error generando PDF ${templateType}:`, error.message);
    console.error(error.stack);
    return null;
  }
}

/**
 * Genera todos los PDFs de prueba
 */
async function generateAllTestPdfs() {
  console.log('🚀 Iniciando generación de PDFs de prueba...');
  console.log('==================================================\n');

  const results = {};

  for (const templateType of Object.keys(MOCK_DATA)) {
    const url = await generateTestPdf(templateType);
    results[templateType] = url;
  }

  console.log('\n==================================================');
  console.log('📊 RESUMEN DE GENERACIÓN:\n');

  for (const [type, url] of Object.entries(results)) {
    if (url) {
      console.log(`✅ ${type}:`);
      console.log(`   ${url}\n`);
    } else {
      console.log(`❌ ${type}: FALLÓ\n`);
    }
  }

  console.log('==================================================');
}

/**
 * Genera solo un PDF específico
 */
async function generateSinglePdf(templateType) {
  if (!MOCK_DATA[templateType]) {
    console.error(`❌ Tipo de template inválido: ${templateType}`);
    console.log(`Tipos disponibles: ${Object.keys(MOCK_DATA).join(', ')}`);
    return;
  }

  await generateTestPdf(templateType);
}

// Ejecutar el script
if (require.main === module) {
  const args = process.argv.slice(2);
  const specificType = args[0];

  if (specificType) {
    // Generar un PDF específico
    generateSinglePdf(specificType)
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    // Generar todos los PDFs
    generateAllTestPdfs()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

module.exports = {
  generateTestPdf,
  generateAllTestPdfs,
  generateSinglePdf,
};
