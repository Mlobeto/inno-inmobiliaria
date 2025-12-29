const { Client, Property, ClientProperty, Lease } = require('../data');

const seedLeases = async () => {
  try {
    console.log('🏠 Iniciando seed de contratos de alquiler...');

    // Ahora esto debería funcionar con las asociaciones corregidas
    const propertiesForRent = await Property.findAll({
      where: { 
        type: 'alquiler',
        isAvailable: true 
      },
      include: [{
        model: ClientProperty,
        where: { role: 'propietario' },
        include: [{
          model: Client
        }]
      }],
      limit: 4
    });

    if (propertiesForRent.length < 3) {
      throw new Error(`Se necesitan al menos 3 propiedades de alquiler disponibles. Solo hay ${propertiesForRent.length}`);
    }

    // Obtener inquilinos (clientes que no sean propietarios de estas propiedades)
    const allClients = await Client.findAll();
    const usedLandlordIds = propertiesForRent.map(p => p.ClientProperties[0].clientId);
    const availableTenants = allClients.filter(c => !usedLandlordIds.includes(c.idClient));

    if (availableTenants.length < 3) {
      throw new Error(`Se necesitan al menos 3 inquilinos disponibles. Solo hay ${availableTenants.length}`);
    }

    console.log(`📋 ${propertiesForRent.length} propiedades disponibles para alquiler`);
    console.log(`👥 ${availableTenants.length} inquilinos disponibles`);

    // Definir los contratos de prueba
    const leaseTemplates = [
      {
        description: "Contrato que necesita actualización semestral",
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 8)),
        totalMonths: 24,
        updateFrequency: 'semestral',
        rentAmount: 150000,
        commission: 8.5,
        inventory: "Departamento amoblado: sofá, mesa de comedor, cama matrimonial, heladera, cocina, microondas, aire acondicionado, TV LED 42', placard empotrado"
      },
      {
        description: "Contrato que necesita actualización anual",
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 13)),
        totalMonths: 36,
        updateFrequency: 'anual',
        rentAmount: 200000,
        commission: 7,
        inventory: "Casa completa: living-comedor, cocina equipada, 3 dormitorios con placard, 2 baños, patio con parrilla, garage techado"
      },
      {
        description: "Contrato que necesita actualización cuatrimestral",
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 5)),
        totalMonths: 18,
        updateFrequency: 'cuatrimestral',
        rentAmount: 180000,
        commission: 9,
        inventory: "Oficina comercial: escritorio ejecutivo, sillas, archiveros, aire acondicionado, conexión a internet, teléfono"
      },
      {
        description: "Contrato próximo a finalizar (para pruebas de terminación)",
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 22)),
        totalMonths: 24,
        updateFrequency: 'anual',
        rentAmount: 120000,
        commission: 8,
        inventory: "Monoambiente: cama, mesa pequeña, silla, kitchenette, baño privado, calefacción eléctrica"
      }
    ];

    const createdLeases = [];

    for (let i = 0; i < Math.min(leaseTemplates.length, propertiesForRent.length, availableTenants.length); i++) {
      const template = leaseTemplates[i];
      const property = propertiesForRent[i];
      const landlord = property.ClientProperties[0].Client;
      const tenant = availableTenants[i];

      try {
        console.log(`\n📝 Creando contrato ${i + 1}: ${template.description}`);
        console.log(`   Propiedad: ${property.address} (ID: ${property.propertyId})`);
        console.log(`   Propietario: ${landlord.name} (ID: ${landlord.idClient})`);
        console.log(`   Inquilino: ${tenant.name} (ID: ${tenant.idClient})`);
        console.log(`   Fecha inicio: ${template.startDate.toLocaleDateString()}`);

        // Crear el contrato
        const lease = await Lease.create({
          propertyId: property.propertyId,
          landlordId: landlord.idClient,
          tenantId: tenant.idClient,
          startDate: template.startDate,
          rentAmount: template.rentAmount,
          updateFrequency: template.updateFrequency,
          commission: template.commission,
          totalMonths: template.totalMonths,
          inventory: template.inventory,
          status: 'active'
        });

        // Marcar propiedad como no disponible
        await property.update({ isAvailable: false });

        // Asignar rol de inquilino
        await ClientProperty.create({
          clientId: tenant.idClient,
          propertyId: property.propertyId,
          role: 'inquilino'
        });

        // Calcular fecha de finalización para logs
        const endDate = new Date(template.startDate);
        endDate.setMonth(endDate.getMonth() + template.totalMonths);
        
        console.log(`   ✅ Contrato creado con ID: ${lease.id}`);
        console.log(`   📅 Fecha de finalización: ${endDate.toLocaleDateString()}`);
        
        // Determinar si necesita actualización
        const monthsSinceStart = Math.floor((new Date() - template.startDate) / (1000 * 60 * 60 * 24 * 30.44));
        let needsUpdate = false;
        
        switch (template.updateFrequency) {
          case 'semestral':
            needsUpdate = monthsSinceStart >= 6;
            break;
          case 'cuatrimestral':
            needsUpdate = monthsSinceStart >= 4;
            break;
          case 'anual':
            needsUpdate = monthsSinceStart >= 12;
            break;
        }
        
        console.log(`   🔄 Meses desde inicio: ${monthsSinceStart}, Necesita actualización: ${needsUpdate ? 'SÍ' : 'NO'}`);
        
        createdLeases.push({
          lease,
          property: property.address,
          landlord: landlord.name,
          tenant: tenant.name,
          needsUpdate,
          monthsRemaining: template.totalMonths - monthsSinceStart
        });

      } catch (error) {
        console.error(`❌ Error creando contrato ${i + 1}:`, error.message);
      }
    }

    console.log('\n🎉 Seed de contratos completado!');
    console.log('\n📊 Resumen de contratos creados:');
    
    createdLeases.forEach((item, index) => {
      console.log(`\n${index + 1}. Contrato ID: ${item.lease.id}`);
      console.log(`   📍 ${item.property}`);
      console.log(`   👤 ${item.landlord} → ${item.tenant}`);
      console.log(`   💰 $${item.lease.rentAmount.toLocaleString()}`);
      console.log(`   📅 ${item.lease.updateFrequency}`);
      console.log(`   🔄 Necesita actualización: ${item.needsUpdate ? 'SÍ' : 'NO'}`);
      console.log(`   ⏰ Meses restantes: ${Math.max(0, item.monthsRemaining)}`);
    });

    console.log('\n🔧 Comandos de prueba disponibles:');
    console.log('- Para debuggear alertas: GET /api/leases/debug-alerts');
    console.log('- Para crear actualización de prueba: POST /api/leases/:id/test-update');
    console.log('- Para terminar contrato: PUT /api/leases/:id/terminate');
    
    return createdLeases;
    
  } catch (error) {
    console.error('💥 Error en seed de contratos:', error.message);
    throw error;
  }
};

module.exports = seedLeases;