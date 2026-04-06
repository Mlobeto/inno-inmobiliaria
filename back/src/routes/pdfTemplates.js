const express = require("express");
const router = express.Router();
const {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  setAsDefault,
  getTemplateTypes,
  renderForLease,
} = require("../controllers/PdfTemplateController");
const { tenancyMiddleware } = require("../middlewares/tenancyMiddleware");

/**
 * Todas las rutas requieren autenticación y tenancyMiddleware
 * El tenancyMiddleware inyecta el tenantId del usuario autenticado
 */

// Obtener tipos de plantillas disponibles
router.get("/types", tenancyMiddleware, getTemplateTypes);

// Renderizar plantilla por defecto con datos de un lease
router.get("/render/lease/:leaseId", tenancyMiddleware, renderForLease);

// Obtener todas las plantillas del tenant
router.get("/", tenancyMiddleware, getAllTemplates);

// Obtener una plantilla específica
router.get("/:id", tenancyMiddleware, getTemplateById);

// Crear nueva plantilla
router.post("/", tenancyMiddleware, createTemplate);

// Actualizar plantilla existente
router.put("/:id", tenancyMiddleware, updateTemplate);

// Eliminar plantilla (soft delete)
router.delete("/:id", tenancyMiddleware, deleteTemplate);

// Duplicar plantilla
router.post("/:id/duplicate", tenancyMiddleware, duplicateTemplate);

// Marcar como predeterminada
router.post("/:id/set-default", tenancyMiddleware, setAsDefault);

module.exports = router;
