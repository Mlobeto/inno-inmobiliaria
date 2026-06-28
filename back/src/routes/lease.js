const express = require('express');
const { 
  createLease, 
  getLeaseById, 
  getAllLeases, 
  getLeasesPendingUpdate, 
  terminateLease, 
  savePdf, 
  updateRentAmount,
  updateLease,
  fixForeignKeyConstraints,
  createTestRentUpdate,
  debugLeaseAlerts, 
  getLeaseUpdateHistory,
  quickUpdateLeaseRent,
  getExpiringLeases,
  getUpdateStatistics,
  bulkUpdateLeases
} = require('../controllers');
const prisma = require('../utils/prismaClient');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const router = express.Router();

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

// Add logging middleware
router.use((req, res, next) => {
    console.log('Lease Route:', {
        method: req.method,
        path: req.path,
        body: req.body
    });
    next();
});

// POST route for creating a new lease
router.post('/', createLease);
router.post('/savePdf', savePdf);

// Testing and debugging routes
router.post('/fix-constraints', fixForeignKeyConstraints);
router.post('/:id/test-update', createTestRentUpdate);
router.post('/bulk-update', bulkUpdateLeases); // 🆕
// Función simplificada para crear un contrato de prueba
router.post('/create-test-lease', async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    console.log('[TEST] Creando contrato de prueba...');
    
    const testLease = await prisma.Leases.create({
      data: {
      propertyId: 1,
      landlordId: 1,
      renterId: 2,
      startDate: '2024-01-15', // Hace unos meses
      rentAmount: 50000,
      updateFrequency: 'semestral',
      commission: 4.5,
      totalMonths: 24,
      inventory: 'Inventario de prueba para testing',
      status: 'active',
      tenantId,
      }
    });

    console.log('[TEST] Contrato creado:', testLease);

    res.json({
      message: 'Contrato de prueba creado exitosamente',
      lease: testLease
    });

  } catch (error) {
    console.error('Error creando contrato de prueba:', error);
    res.status(500).json({ 
      message: 'Error al crear contrato de prueba', 
      error: error.message,
      details: error.parent?.detail || 'No hay detalles adicionales'
    });
  }
});

router.get('/debug/alerts', async (req, res) => {
  try {
    console.log('[DEBUG] Iniciando debug de alertas de contratos - SIMPLE');
    const { tenantId } = req.user;
    
    // Obtener contratos sin includes para evitar el problema de asociaciones
    const leases = await prisma.Leases.findMany({ where: { tenantId } });
    console.log(`[DEBUG] Encontrados ${leases.length} contratos`);

    const now = new Date();
    const debugInfo = leases.map(lease => {
      // Cálculo simple de próxima actualización
      let freqMonths = 0;
      if (lease.updateFrequency === 'semestral') freqMonths = 6;
      else if (lease.updateFrequency === 'cuatrimestral') freqMonths = 4;
      else if (lease.updateFrequency === 'anual') freqMonths = 12;

      const startDate = new Date(lease.startDate);
      let nextUpdate = new Date(startDate);
      while (nextUpdate <= now) {
        nextUpdate.setMonth(nextUpdate.getMonth() + freqMonths);
      }

      const daysUntilUpdate = Math.ceil((nextUpdate - now) / (1000 * 60 * 60 * 24));
      const shouldAlert = daysUntilUpdate <= 30 && daysUntilUpdate >= 0;

      return {
        leaseId: lease.id,
        renterId: lease.renterId,
        landlordId: lease.landlordId,
        propertyId: lease.propertyId,
        startDate: lease.startDate,
        updateFrequency: lease.updateFrequency,
        currentRent: lease.rentAmount,
        nextUpdateDate: nextUpdate.toLocaleDateString(),
        daysUntilUpdate,
        shouldAlert,
        status: lease.status
      };
    });

    res.json({
      message: 'Debug de alertas completado (simple)',
      currentDate: now.toLocaleDateString(),
      totalLeases: leases.length,
      alertCount: debugInfo.filter(info => info.shouldAlert).length,
      debugInfo
    });

  } catch (error) {
    console.error('Error en debug simple:', error);
    res.status(500).json({ message: 'Error al debuggear alertas (simple)', error: error.message });
  }
});

router.get('/all', getAllLeases);
router.get('/pending-updates', getLeasesPendingUpdate);
router.get('/statistics', getUpdateStatistics); // 🆕
router.get('/expiring', getExpiringLeases); // 🆕
router.get('/:id/update-history', getLeaseUpdateHistory); // 🆕

router.put('/:id/terminate', terminateLease);
router.put('/:id/quick-update', quickUpdateLeaseRent); // 🆕
router.put('/:id', updateLease); // 🆕 Actualización general de lease
router.put('/:id/rent', updateRentAmount);
router.put('/leases/:id/rent', updateRentAmount);

router.get('/:id', getLeaseById);

module.exports = router;