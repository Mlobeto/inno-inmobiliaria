const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/SubscriptionController');
const { tenancyMiddleware } = require('../middlewares/authMiddleware');

// Rutas públicas (para obtener planes antes de autenticar)
router.get('/plans', SubscriptionController.getPlans);

// Rutas protegidas (requieren autenticación)
router.get('/current', tenancyMiddleware, SubscriptionController.getCurrentSubscription);
router.post('/create-subscription', tenancyMiddleware, SubscriptionController.createSubscription);
router.post('/cancel', tenancyMiddleware, SubscriptionController.cancelSubscription);
router.post('/change-plan', tenancyMiddleware, SubscriptionController.changePlan);
router.post('/start-trial', tenancyMiddleware, SubscriptionController.startTrial);

module.exports = router;
