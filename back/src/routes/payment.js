const express = require('express');
const { createPayment, getPaymentsByIdClient, getAllPayments, getPaymentsByLeaseId } = require('../controllers');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const router = express.Router();

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

router.post('/', createPayment);
router.get('/', getAllPayments);
router.get('/lease/:leaseId', getPaymentsByLeaseId);
router.get('/client/:idClient', getPaymentsByIdClient);


module.exports = router;