const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/SubscriptionController');
const verifyMpSignature = require('../middlewares/verifyMpSignature');

// Webhook de MercadoPago
// Importante: este endpoint NO debe tener autenticación JWT,
// pero sí verificación de firma para evitar requests fraudulentos.
router.post('/mercadopago', verifyMpSignature, SubscriptionController.handleMercadoPagoWebhook);

module.exports = router;
