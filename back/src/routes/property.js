const { Router } = require("express");
const { 
  createProperty, 
  getAllProperties, 
  getPropertyById,
  getPropertiesByIdClient,
  getPropertiesByType,
  deleteProperty,
  updateProperty,
  getFilteredProperties,
  getWhatsAppText
} = require("../controllers");

const router = Router();

// Middleware para loggear todas las peticiones a /property
router.use((req, res, next) => {
  console.log(`[Property Route] ${req.method} ${req.originalUrl}`);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  next();
});

router.get("/filtered", getFilteredProperties);
router.get("/type/:type", getPropertiesByType);
router.get("/client/:idClient", getPropertiesByIdClient);

// Ruta para obtener texto de WhatsApp (debe ir ANTES de /:propertyId)
router.get("/:id/whatsapp", getWhatsAppText);

// Agregamos logging específico para la ruta getPropertyById
router.get("/:propertyId", (req, res, next) => {
  console.log('[GetPropertyById] Parámetros recibidos:', {
    propertyId: req.params.propertyId,
    type: typeof req.params.propertyId
  });
  next();
}, getPropertyById);

router.get("/", getAllProperties);
router.post("/", createProperty);
router.put("/:propertyId", updateProperty);
router.delete("/:propertyId", deleteProperty);

module.exports = router;
