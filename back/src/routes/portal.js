const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');
const portalMiddleware = require('../middlewares/portalMiddleware');
const PortalController = require('../controllers/PortalController');

// Almacenamiento temporal para comprobantes (mismo sistema que /api/upload)
const tmpDir = path.join(__dirname, '../../tmp-uploads');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpDir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

/**
 * GET /api/portal/tenant?code=admin21
 * Resuelve el código/subdomain al tenantId y nombre. Público.
 */
router.get('/tenant', PortalController.lookupTenant);

/**
 * POST /api/portal/auth
 * Autenticación del inquilino con email + cuil
 * X-Tenant-Id header o tenantId en body para identificar la inmobiliaria
 */
router.post('/auth', tenancyMiddleware, PortalController.login);

/**
 * GET /api/portal/mis-pagos
 * Lista las cuotas del inquilino autenticado + métodos de pago del tenant
 */
router.get('/mis-pagos', portalMiddleware, PortalController.getMisPagos);

/**
 * POST /api/portal/pago/:id/comprobante
 * Sube comprobante de pago (imagen/pdf) para una cuota
 * Multipart: field "file"
 */
router.post(
  '/pago/:id/comprobante',
  portalMiddleware,
  upload.single('file'),
  PortalController.subirComprobante
);

module.exports = router;
