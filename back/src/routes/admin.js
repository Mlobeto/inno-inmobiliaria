const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const AdminSettingsController = require('../controllers/AdminSettingsController');
const TenantController = require('../controllers/TenantController');
const router = express.Router();

// Primero autenticar, luego aplicar tenancy
router.use(authMiddleware);
router.use(tenancyMiddleware);

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