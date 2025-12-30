const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/SubscriptionController');

// Webhook de MercadoPago
// Importante: este endpoint NO debe tener autenticación
router.post('/mercadopago', SubscriptionController.handleMercadoPagoWebhook);

module.exports = router;
