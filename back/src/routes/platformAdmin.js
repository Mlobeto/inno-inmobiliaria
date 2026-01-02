const express = require('express');
const router = express.Router();
const platformAdminController = require('../controllers/PlatformAdminController');
const { authenticate } = require('../middlewares/authMiddleware');
const { isPlatformAdmin } = require('../middlewares/platformAdminMiddleware');

// Aplicar autenticación y validación de PLATFORM_ADMIN a todas las rutas
router.use(authenticate);
router.use(isPlatformAdmin);

/**
 * Dashboard y métricas generales
 */
router.get('/dashboard', platformAdminController.getDashboard);
router.get('/metrics', platformAdminController.getMetrics);
router.get('/revenue', platformAdminController.getRevenue);

/**
 * Gestión de tenants
 */
router.get('/tenants', platformAdminController.listTenants);
router.get('/tenants/:tenantId', platformAdminController.getTenantDetail);
router.put('/tenants/:tenantId', platformAdminController.updateTenant);
router.post('/tenants/:tenantId/suspend', platformAdminController.suspendTenant);
router.post('/tenants/:tenantId/activate', platformAdminController.activateTenant);

/**
 * Gestión de suscripciones
 */
router.get('/subscriptions', platformAdminController.listSubscriptions);

module.exports = router;
