const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const azureBlobHelper = require('../utils/azureBlobHelper');

const router = express.Router();

// Almacenamiento temporal en disco (necesario para sharp que lee desde path)
const tmpDir = path.join(__dirname, '../../tmp-uploads');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tmpDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB máximo
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg\+xml|mp4|mov|avi/;
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

/**
 * POST /api/upload
 * body (multipart): file, resourceType (properties|logos|signatures|pdfs|receipts)
 * Requiere: authMiddleware + tenancyMiddleware (montados en index.js)
 */
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió ningún archivo' });
  }

  const { resourceType = 'properties' } = req.body;
  const tenantId = req.tenantId;
  const filePath = req.file.path;

  try {
    const result = await azureBlobHelper.uploadFile(filePath, tenantId, resourceType, {
      originalName: req.file.originalname,
    });

    return res.status(200).json({
      url: result.url,
      blobName: result.blobName,
      size: result.bytes,
      contentType: result.contentType,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error al subir el archivo', details: error.message });
  } finally {
    // Siempre limpiar el archivo temporal
    fs.unlink(filePath, () => {});
  }
});

module.exports = router;
