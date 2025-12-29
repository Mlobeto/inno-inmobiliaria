const express = require('express');
const { createPayment, getPaymentsByIdClient, getAllPayments, getPaymentsByLeaseId } = require('../controllers');
const router = express.Router();

router.post('/', createPayment);
router.get('/', getAllPayments);
router.get('/lease/:leaseId', getPaymentsByLeaseId);
router.get('/client/:idClient', getPaymentsByIdClient);


module.exports = router;