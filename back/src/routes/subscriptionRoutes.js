const express = require('express');
const router = express.Router();
const { tenancyMiddleware } = require('../middlewares/authMiddleware');

// Cargar controlador de forma segura
let SubscriptionController;
try {
  SubscriptionController = require('../controllers/SubscriptionController');
  console.log('✅ SubscriptionController cargado:', Object.keys(SubscriptionController));
} catch (error) {
  console.error('❌ Error cargando SubscriptionController:', error.message);
  console.error(error.stack);
  
  // Crear controlador temporal con mensajes de error
  SubscriptionController = {
    getPlans: (req, res) => res.status(500).json({ error: 'SubscriptionController no disponible' }),
    getCurrentSubscription: (req, res) => res.status(500).json({ error: 'SubscriptionController no disponible' }),
    createSubscription: (req, res) => res.status(500).json({ error: 'SubscriptionController no disponible' }),
    cancelSubscription: (req, res) => res.status(500).json({ error: 'SubscriptionController no disponible' }),
    changePlan: (req, res) => res.status(500).json({ error: 'SubscriptionController no disponible' }),
    startTrial: (req, res) => res.status(500).json({ error: 'SubscriptionController no disponible' })
  };
}

// Rutas públicas (para obtener planes antes de autenticar)
router.get('/plans', SubscriptionController.getPlans);

// Rutas protegidas (requieren autenticación)
router.get('/current', tenancyMiddleware, SubscriptionController.getCurrentSubscription);
router.post('/create-subscription', tenancyMiddleware, SubscriptionController.createSubscription);
router.post('/cancel', tenancyMiddleware, SubscriptionController.cancelSubscription);
router.post('/change-plan', tenancyMiddleware, SubscriptionController.changePlan);
router.post('/start-trial', tenancyMiddleware, SubscriptionController.startTrial);

module.exports = router;
