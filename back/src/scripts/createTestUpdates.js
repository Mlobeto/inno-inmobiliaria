const { Lease, RentUpdate } = require('../data');

const createTestUpdates = async () => {
  try {
    console.log('🧪 Creando actualizaciones de prueba...');
    
    // Obtener todos los contratos activos
    const activeLeases = await Lease.findAll({
      where: { status: 'active' }
    });

    if (activeLeases.length === 0) {
      console.log('No hay contratos activos para actualizar');
      return;
    }

    for (const lease of activeLeases) {
      const monthsSinceStart = Math.floor((new Date() - new Date(lease.startDate)) / (1000 * 60 * 60 * 24 * 30.44));
      
      // Determinar si el contrato necesita actualizaciones históricas
      let updatesMade = 0;
      const currentAmount = lease.rentAmount;
      
      switch (lease.updateFrequency) {
        case 'semestral':
          if (monthsSinceStart >= 6) {
            // Crear actualización hace 6 meses
            const updateDate = new Date(lease.startDate);
            updateDate.setMonth(updateDate.getMonth() + 6);
            
            await RentUpdate.create({
              leaseId: lease.id,
              updateDate: updateDate,
              oldRentAmount: currentAmount,
              newRentAmount: currentAmount * 1.15, // 15% de aumento
              period: 'Semestre 1',
              pdfPath: `/pdfs/update_${lease.id}_sem1.pdf`,
              createdAt: updateDate,
              updatedAt: updateDate
            });
            
            updatesMade++;
            console.log(`📈 Actualización semestral creada para contrato ${lease.id}`);
          }
          break;
          
        case 'anual':
          if (monthsSinceStart >= 12) {
            // Crear actualización hace 12 meses
            const updateDate = new Date(lease.startDate);
            updateDate.setMonth(updateDate.getMonth() + 12);
            
            await RentUpdate.create({
              leaseId: lease.id,
              updateDate: updateDate,
              oldRentAmount: currentAmount,
              newRentAmount: currentAmount * 1.20, // 20% de aumento
              period: 'Año 1',
              pdfPath: `/pdfs/update_${lease.id}_year1.pdf`,
              createdAt: updateDate,
              updatedAt: updateDate
            });
            
            updatesMade++;
            console.log(`📈 Actualización anual creada para contrato ${lease.id}`);
          }
          break;
          
        case 'cuatrimestral':
          if (monthsSinceStart >= 4) {
            // Crear actualización hace 4 meses
            const updateDate = new Date(lease.startDate);
            updateDate.setMonth(updateDate.getMonth() + 4);
            
            await RentUpdate.create({
              leaseId: lease.id,
              updateDate: updateDate,
              oldRentAmount: currentAmount,
              newRentAmount: currentAmount * 1.10, // 10% de aumento
              period: 'Cuatrimestre 1',
              pdfPath: `/pdfs/update_${lease.id}_cuatr1.pdf`,
              createdAt: updateDate,
              updatedAt: updateDate
            });
            
            updatesMade++;
            console.log(`📈 Actualización cuatrimestral creada para contrato ${lease.id}`);
          }
          break;
      }
    }
    
    console.log('✅ Actualizaciones de prueba completadas');
    
  } catch (error) {
    console.error('Error creando actualizaciones de prueba:', error);
  }
};

module.exports = createTestUpdates;