const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const MercadoLibreController = require('../controllers/MercadoLibreController');

// ====================================
// AUTENTICACIÓN
// ====================================

// Callback OAuth: fuera de authMiddleware porque llega como redirección del navegador
// desde MercadoLibre (sin JWT Bearer token). El tenantId se extrae del parámetro state.
router.get('/callback', MercadoLibreController.handleCallback.bind(MercadoLibreController));

// El resto de rutas requieren autenticación y tenancy
router.use(authMiddleware);
router.use(tenancyMiddleware);

// Iniciar flujo OAuth
router.get('/auth/start', MercadoLibreController.startAuth.bind(MercadoLibreController));

// Obtener estado de conexión
router.get('/status', MercadoLibreController.getConnectionStatus.bind(MercadoLibreController));

// Desconectar
router.post('/disconnect', MercadoLibreController.disconnect.bind(MercadoLibreController));

// ====================================
// PUBLICACIONES
// ====================================

// Obtener lista de publicaciones
router.get('/listings', MercadoLibreController.getListings.bind(MercadoLibreController));

// Publicar propiedad
router.post('/publish/:propertyId', MercadoLibreController.publishProperty.bind(MercadoLibreController));

// Actualizar estado (pausar/reactivar)
router.put('/listings/:propertyId/status', MercadoLibreController.updateListingStatus.bind(MercadoLibreController));

// Eliminar publicación
router.delete('/listings/:propertyId', MercadoLibreController.deleteListingSync.bind(MercadoLibreController));

module.exports = router;
