const { Router } = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const { requireTenantScope } = require('../middlewares/platformAdminMiddleware');
const {
  listModules,
  getTenantModules,
  activateModules,
  deactivateModule,
} = require('../controllers/ModuleController');

const router = Router();

// Público: lista de módulos disponibles (para landing y registro)
router.get('/', listModules);

// Requieren autenticación
router.get('/tenant', authMiddleware, requireTenantScope, tenancyMiddleware, getTenantModules);
router.post('/activate', authMiddleware, requireTenantScope, tenancyMiddleware, activateModules);
router.post('/deactivate', authMiddleware, requireTenantScope, tenancyMiddleware, deactivateModule);

module.exports = router;
