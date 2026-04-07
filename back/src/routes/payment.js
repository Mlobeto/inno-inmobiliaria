const express = require('express');
const { createPayment, getPaymentsByIdClient, getAllPayments, getPaymentsByLeaseId, updatePayment, deletePayment } = require('../controllers');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const router = express.Router();

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

router.post('/', createPayment);
router.get('/', getAllPayments);
router.get('/lease/:leaseId', getPaymentsByLeaseId);
router.get('/client/:idClient', getPaymentsByIdClient);
router.put('/:id', updatePayment);
router.delete('/:id', deletePayment);

module.exports = router;