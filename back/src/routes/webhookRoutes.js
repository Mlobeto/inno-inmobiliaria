const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/SubscriptionController');
const MercadoLibreController = require('../controllers/MercadoLibreController');
const verifyMpSignature = require('../middlewares/verifyMpSignature');
const { webhookLimiter } = require('../middlewares/rateLimiter');

// Webhook de MercadoPago
// Importante: este endpoint NO debe tener autenticación JWT,
// pero sí verificación de firma para evitar requests fraudulentos.
router.post('/mercadopago', webhookLimiter, verifyMpSignature, SubscriptionController.handleMercadoPagoWebhook);

// Notificaciones Mercado Libre (preguntas, cambios de publicación)
router.post('/mercadolibre', webhookLimiter, MercadoLibreController.handleWebhook.bind(MercadoLibreController));

module.exports = router;
