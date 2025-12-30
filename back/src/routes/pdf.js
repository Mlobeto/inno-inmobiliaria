const express = require("express");
const router = express.Router();
const PdfController = require("../controllers/PdfController");
const { tenancyMiddleware } = require("../middlewares/tenancyMiddleware");

// Todas las rutas requieren tenancyMiddleware
router.use(tenancyMiddleware);

/**
 * @route POST /api/pdf/generate
 * @desc Genera un PDF usando un template y datos específicos
 * @body {String} templateType - Tipo de template (CONTRATO_ALQUILER, etc)
 * @body {Number} dataId - ID del registro (leaseId, propertyId, paymentId)
 * @body {Number} templateId - (Opcional) ID de template específico
 * @body {Object} customVariables - (Opcional) Variables adicionales
 */
router.post("/generate", PdfController.generatePdf);

/**
 * @route GET /api/pdf/templates
 * @desc Lista todos los templates del tenant
 * @query {String} templateType - (Opcional) Filtrar por tipo
 * @query {Boolean} isActive - (Opcional) Filtrar por estado
 */
router.get("/templates", PdfController.getTemplates);

/**
 * @route GET /api/pdf/templates/:id
 * @desc Obtiene un template específico
 * @param {Number} id - ID del template
 */
router.get("/templates/:id", PdfController.getTemplateById);

/**
 * @route POST /api/pdf/templates
 * @desc Crea un nuevo template (solo SUPER_ADMIN)
 * @body {String} templateType - Tipo de template
 * @body {String} templateName - Nombre descriptivo
 * @body {String} htmlTemplate - HTML con variables Handlebars
 * @body {String} styles - CSS personalizado
 * @body {String} headerHtml - HTML para encabezado
 * @body {String} footerHtml - HTML para pie de página
 * @body {Object} variables - Descripción de variables
 * @body {String} pageSize - Tamaño (A4, Letter, Legal)
 * @body {String} orientation - portrait o landscape
 * @body {Object} margins - Márgenes del PDF
 * @body {Boolean} isDefault - Si es template por defecto
 */
router.post("/templates", PdfController.createTemplate);

/**
 * @route PUT /api/pdf/templates/:id
 * @desc Actualiza un template existente (solo SUPER_ADMIN)
 * @param {Number} id - ID del template
 */
router.put("/templates/:id", PdfController.updateTemplate);

/**
 * @route DELETE /api/pdf/templates/:id
 * @desc Elimina un template (solo SUPER_ADMIN)
 * @param {Number} id - ID del template
 */
router.delete("/templates/:id", PdfController.deleteTemplate);

/**
 * @route POST /api/pdf/preview
 * @desc Genera un preview de un template sin guardarlo
 * @body {Number} templateId - (Opcional) ID de template existente
 * @body {String} htmlTemplate - (Opcional) HTML temporal para preview
 * @body {String} styles - (Opcional) CSS temporal
 * @body {String} headerHtml - (Opcional) Header temporal
 * @body {String} footerHtml - (Opcional) Footer temporal
 * @body {Object} sampleData - Datos de ejemplo para el preview
 */
router.post("/preview", PdfController.previewTemplate);

module.exports = router;
