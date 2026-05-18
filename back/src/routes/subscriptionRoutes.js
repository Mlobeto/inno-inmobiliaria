const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/SubscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');

console.log('🔄 Cargando subscriptionRoutes.js - v5');
console.log('✅ SubscriptionController:', SubscriptionController);
console.log('✅ tenancyMiddleware:', typeof tenancyMiddleware);
console.log('✅ getPlans:', typeof SubscriptionController.getPlans);

const AGENT_FORBIDDEN_BODY = {
  success: false,
  code: 'AGENT_RESTRICTED',
  message: 'Tu usuario agente tiene acceso solo a Leads y a tus propias comisiones.',
};

/** Agente: puede consultar solo el estado de suscripción (guards del front). */
function subscriptionAgentScope(req, res, next) {
  if (req.user?.role !== 'AGENT') return next();
  const normalized = (req.path || '').replace(/\/$/, '') || '/';
  if (req.method === 'GET' && normalized === '/current') return next();
  res.status(403).json(AGENT_FORBIDDEN_BODY);
}

// Rutas públicas (para obtener planes antes de autenticar)
router.get('/plans', SubscriptionController.getPlans);

// Rutas protegidas (requieren autenticación y tenancy)
router.use(authMiddleware);
router.use(tenancyMiddleware);
router.use(subscriptionAgentScope);

router.get('/current', SubscriptionController.getCurrentSubscription);
router.get('/payment-history', SubscriptionController.getPaymentHistory);
router.post('/create-subscription', SubscriptionController.createSubscription);
router.post('/cancel', SubscriptionController.cancelSubscription);
router.post('/change-plan', SubscriptionController.changePlan);
router.post('/start-trial', SubscriptionController.startTrial);

module.exports = router;
