const express = require("express");
const router = express.Router();
const TenantController = require("../controllers/TenantController");
const { tenancyMiddleware } = require("../middlewares/tenancyMiddleware");

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

/**
 * @route POST /api/tenant/signature
 * @desc Sube o actualiza la firma digital del tenant
 * @body {String} signatureDataUrl - Base64 data URL de la imagen
 * @access Private (SUPER_ADMIN)
 */
router.post("/signature", TenantController.uploadSignature);

/**
 * @route GET /api/tenant/signature
 * @desc Obtiene la URL de la firma digital del tenant
 * @access Private
 */
router.get("/signature", TenantController.getSignature);

/**
 * @route DELETE /api/tenant/signature
 * @desc Elimina la firma digital del tenant
 * @access Private (SUPER_ADMIN)
 */
router.delete("/signature", TenantController.deleteSignature);

/**
 * @route GET /api/tenant/info
 * @desc Obtiene información del tenant actual
 * @access Private
 */
router.get("/info", TenantController.getTenantInfo);

/**
 * @route PUT /api/tenant/info
 * @desc Actualiza información del tenant
 * @body {String} businessName, email, phone, address, logo
 * @access Private (SUPER_ADMIN)
 */
router.put("/info", TenantController.updateTenantInfo);

/**
 * @route POST /api/tenant/check-subdomain
 * @desc Verifica si un subdominio está disponible
 * @body {String} subdomain - Subdominio a verificar
 * @access Private
 */
router.post("/check-subdomain", TenantController.checkSubdomainAvailability);

/**
 * @route PUT /api/tenant/subdomain
 * @desc Actualiza el subdominio del tenant (solo si tiene plan con landing)
 * @body {String} subdomain - Nuevo subdominio
 * @access Private (SUPER_ADMIN)
 */
router.put("/subdomain", TenantController.updateSubdomain);

/**
 * @route GET /api/tenant/payment-methods
 * @desc Lista los métodos de pago configurados
 * @access Private
 */
router.get("/payment-methods", TenantController.getPaymentMethods);

/**
 * @route POST /api/tenant/payment-methods
 * @body { type, label, value } — para QR: subir imagen con /api/upload y pasar la URL como value
 * @access Private (SUPER_ADMIN)
 */
router.post("/payment-methods", TenantController.createPaymentMethod);

/**
 * @route PUT /api/tenant/payment-methods/:id
 * @access Private (SUPER_ADMIN)
 */
router.put("/payment-methods/:id", TenantController.updatePaymentMethod);

/**
 * @route DELETE /api/tenant/payment-methods/:id
 * @access Private (SUPER_ADMIN)
 */
router.delete("/payment-methods/:id", TenantController.deletePaymentMethod);

module.exports = router;
