const express = require('express');
const router = express.Router();
const platformAdminController = require('../controllers/PlatformAdminController');
const planController = require('../controllers/PlanController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isPlatformAdmin } = require('../middlewares/platformAdminMiddleware');

// Aplicar autenticación y validación de PLATFORM_ADMIN a todas las rutas
router.use(authMiddleware);
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
router.get('/tenants/check-subdomain/:subdomain', platformAdminController.checkSubdomainAvailability);
router.post('/tenants/create-manual', platformAdminController.createManualTenant);
router.get('/tenants/:tenantId', platformAdminController.getTenantDetail);
router.put('/tenants/:tenantId', platformAdminController.updateTenant);
router.post('/tenants/:tenantId/suspend', platformAdminController.suspendTenant);
router.post('/tenants/:tenantId/activate', platformAdminController.activateTenant);
router.post('/tenants/:tenantId/impersonate', platformAdminController.impersonateTenant);
router.get('/tenants/:tenantId/operational', platformAdminController.getTenantOperational);
router.get('/tenants/:tenantId/payments', platformAdminController.getTenantPayments);
router.get('/tenants/:tenantId/activity', platformAdminController.getTenantActivity);
router.get('/tenants/:tenantId/errors', platformAdminController.getTenantErrors);
router.patch('/tenants/:tenantId/subscription', platformAdminController.updateTenantSubscription);
router.post('/tenants/:tenantId/reset-password', platformAdminController.resetTenantAdminPassword);
router.post('/tenants/:tenantId/send-email', platformAdminController.sendEmailToTenant);
router.delete('/tenants/:tenantId', platformAdminController.deleteTenant);

/**
 * Gestión de suscripciones
 */
router.get('/subscriptions', platformAdminController.listSubscriptions);

/**
 * Gestión de planes
 */
router.get('/plans', planController.getAllPlans);
router.get('/plans/:planId', planController.getPlanById);
router.post('/plans', planController.createPlan);
router.put('/plans/:planId', planController.updatePlan);
router.delete('/plans/:planId', planController.deletePlan);
router.patch('/plans/:planId/toggle-status', planController.togglePlanStatus);

/**
 * Catálogo de módulos (precios add-on)
 */
const moduleAdminController = require('../controllers/ModuleAdminController');
router.get('/modules', moduleAdminController.listModulesAdmin);
router.put('/modules/:moduleId', moduleAdminController.updateModuleCatalog);

module.exports = router;
