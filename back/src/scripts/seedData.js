const fs = require('fs');
const path = require('path');
const prisma = require('../utils/prismaClient');
const seedLeases = require('./seedLeases');

async function seedClients() {
  try {
    console.log('🔄 Cargando clientes...');
    const clientsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'clients.json'), 'utf8')
    );
    
    for (const client of clientsData) {
      await prisma.Clients.create({ data: client });
    }
    console.log('✅ Clientes insertados.');
    
  } catch (error) {
    console.error('❌ Error cargando clientes:', error);
    throw error;
  }
}

async function seedProperties() {
  try {
    console.log('🔄 Cargando propiedades...');
    const propertiesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'properties.json'), 'utf8')
    );

    const clients = await prisma.Clients.findMany();
    
    if (clients.length === 0) {
      throw new Error("No hay clientes. Ejecuta primero seedClients.");
    }

    for (let i = 0; i < propertiesData.length; i++) {
      const propertyData = propertiesData[i];
      const randomClient = clients[Math.floor(Math.random() * clients.length)];
      
      try {
        const property = await prisma.Property.create({ data: propertyData });
        const role = propertyData.type === "alquiler" ? "propietario" : "vendedor";
        
        await prisma.ClientProperties.create({
          data: {
            clientId: randomClient.idClient,
            propertyId: property.propertyId,
            role,
            tenantId: property.tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Propiedad: ${property.address} - ${role}: ${randomClient.name}`);
        
      } catch (error) {
        console.error(`❌ Error: ${propertyData.address}:`, error.message);
      }
    }

    console.log('✅ Propiedades insertadas.');
    
  } catch (error) {
    console.error('❌ Error cargando propiedades:', error);
    throw error;
  }
}

async function seed() {
  try {
    await prisma.$connect();

    // Ejecutar seeds en orden
    await seedClients();
    await seedProperties();
    
    // Esperar un poco para que se establezcan las relaciones
    console.log('⏳ Esperando establecimiento de relaciones...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Crear contratos de prueba
    await seedLeases();
    
    console.log('🎉 Seed completo exitoso!');
    
  } catch (error) {
    console.error('💥 Error en seed:', error);
  }
}

module.exports = seed;