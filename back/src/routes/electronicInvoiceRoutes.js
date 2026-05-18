'use strict';

/**
 * electronicInvoiceRoutes.js
 *
 * Define todos los endpoints del módulo de facturación electrónica ARCA/AFIP.
 *
 * Protecciones en CADA ruta:
 *  1. authMiddleware        → verifica JWT y setea req.user
 *  2. requireTenantScope    → asegura que no sea un PLATFORM_ADMIN usando rutas de tenant
 *  3. tenancyMiddleware     → setea req.tenantId y req.tenant
 *  4. requireFeature(...)   → verifica que el plan del tenant incluya electronic_invoicing
 *  5. tenantLimiter         → rate limiting por tenant
 *
 * El orden de los middlewares es deliberado: no llegar a requireFeature si el tenant
 * no fue resuelto, y no llegar al controller si el feature no está habilitado.
 */

const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const { requireTenantScope } = require('../middlewares/platformAdminMiddleware');
const { tenancyMiddleware, requireFeature } = require('../middlewares/tenancyMiddleware');
const { tenantLimiter } = require('../middlewares/rateLimiter');
const forbidAgents = require('../middlewares/forbidAgents');
const ctrl = require('../controllers/electronicInvoiceController');

// ─── Middleware stack común ─────────────────────────────────────────────────
// Todos los endpoints de este módulo requieren:
//   autenticación → scope de tenant → resolución de tenant → feature flag
router.use(authMiddleware);
router.use(requireTenantScope);
router.use(tenancyMiddleware);
router.use(forbidAgents);
router.use(tenantLimiter);
router.use(requireFeature('electronic_invoicing'));

// ─── Perfil Fiscal (onboarding) ─────────────────────────────────────────────

/**
 * GET /fiscal/profile
 * Obtiene el perfil fiscal del tenant actual.
 */
router.get('/fiscal/profile', ctrl.getProfile);

/**
 * POST /fiscal/profile
 * Crea el perfil fiscal del tenant (onboarding inicial).
 * Solo un perfil por tenant (unique constraint).
 */
router.post('/fiscal/profile', ctrl.createProfile);

/**
 * PATCH /fiscal/profile
 * Actualiza campos no sensibles del perfil fiscal.
 */
router.patch('/fiscal/profile', ctrl.updateProfile);

/**
 * POST /fiscal/profile/certificate
 * Sube el certificado PEM y la clave privada del tenant.
 * La clave privada se cifra en reposo antes de persistir.
 * Requiere HTTPS en producción.
 */
router.post('/fiscal/profile/certificate', ctrl.uploadCertificate);

/**
 * POST /fiscal/profile/test-connection
 * Prueba la autenticación contra WSAA de AFIP con el certificado cargado.
 * Actualiza el estado de onboarding del tenant.
 */
router.post('/fiscal/profile/test-connection', ctrl.testConnection);

// ─── Facturas ───────────────────────────────────────────────────────────────

/**
 * GET /invoices
 * Lista las facturas del tenant (paginado).
 * Query: ?page=1&limit=20&status=authorized&invoiceType=6&pointOfSale=1
 */
router.get('/invoices', ctrl.listInvoices);

/**
 * GET /invoices/:id
 * Obtiene una factura por ID con items y URL del QR si está autorizada.
 */
router.get('/invoices/:id', ctrl.getInvoice);

/**
 * POST /invoices/draft
 * Crea una factura en estado borrador sin contactar ARCA.
 * El número de comprobante y el CAE se asignan al autorizar.
 */
router.post('/invoices/draft', ctrl.createDraft);

/**
 * POST /invoices/:id/authorize
 * Envía la factura a AFIP/ARCA para obtener el CAE.
 * Solo puede llamarse sobre una factura en estado "draft".
 * Implementa idempotencia: si ya está "authorized" devuelve la existente.
 */
router.post('/invoices/:id/authorize', ctrl.authorizeInvoice);

/**
 * POST /invoices/:id/credit-note
 * Emite una nota de crédito sobre una factura autorizada.
 * Crea automáticamente el tipo de comprobante correcto (NC-A/B/C).
 */
router.post('/invoices/:id/credit-note', ctrl.issueCreditNote);

// ─── Auditoría ──────────────────────────────────────────────────────────────

/**
 * GET /fiscal/audit
 * Log de auditoría fiscal del tenant.
 * Query: ?page=1&limit=50&entityType=ElectronicInvoice&action=invoice.authorized
 */
router.get('/fiscal/audit', ctrl.getAuditLog);

module.exports = router;
