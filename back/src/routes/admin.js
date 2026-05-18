const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const AdminSettingsController = require('../controllers/AdminSettingsController');
const TenantController = require('../controllers/TenantController');
const router = express.Router();

const AGENT_FORBIDDEN_BODY = {
  success: false,
  code: 'AGENT_RESTRICTED',
  message: 'Tu usuario agente tiene acceso solo a Leads y a tus propias comisiones.',
};

/** Agente: solo GET /admin/tenant (features y contexto de marca). */
function adminAgentScope(req, res, next) {
  if (req.user?.role !== 'AGENT') return next();
  const normalized = (req.path || '').replace(/\/$/, '') || '/';
  if (req.method === 'GET' && normalized === '/tenant') return next();
  res.status(403).json(AGENT_FORBIDDEN_BODY);
}

// Primero autenticar, luego aplicar tenancy
router.use(authMiddleware);
router.use(tenancyMiddleware);
router.use(adminAgentScope);

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Bienvenido al panel de administración' });
});

// 🆕 Obtener información del tenant actual
router.get('/tenant', TenantController.getTenantInfo);

// 🆕 Rutas de configuración general de la inmobiliaria
router.get('/settings', AdminSettingsController.getSettings);
router.put('/settings', AdminSettingsController.updateSettings);

// Rutas de firma
router.get('/signature', AdminSettingsController.getSignature);
router.post('/signature', AdminSettingsController.saveSignature);
router.delete('/signature', AdminSettingsController.deleteSignature);

module.exports = router;