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

module.exports = router;
