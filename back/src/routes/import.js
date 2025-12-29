const express = require('express');
const multer = require('multer');
const { importClients, importProperties } = require('../controllers/importController');

const router = express.Router();

// Configuración de multer para manejar archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Permitir solo archivos Excel
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx) o CSV'), false);
    }
  }
});

// Ruta para importar clientes
router.post('/clients', upload.single('file'), importClients);

// Ruta para importar propiedades
router.post('/properties', upload.single('file'), importProperties);

// Ruta para obtener plantillas de ejemplo
router.get('/templates', (req, res) => {
  res.json({
    success: true,
    message: 'Plantillas disponibles',
    templates: {
      clients: {
        filename: 'plantilla_clientes.csv',
        description: 'Plantilla para carga masiva de clientes',
        requiredColumns: [
          'cuil (Formato: xx-xxxxxxxx-x)',
          'name (Texto)',
          'email (Email válido)',
          'direccion (Texto)',
          'mobile (10 dígitos)'
        ],
        optionalColumns: [
          'ciudad (Texto, opcional)',
          'provincia (Texto, opcional)',
          'linkMaps (URL de Google Maps, opcional)'
        ]
      },
      properties: {
        filename: 'plantilla_propiedades.xlsx',
        description: 'Plantilla para carga masiva de propiedades',
        requiredColumns: [
          'address (Texto)',
          'neighborhood (Texto, opcional)',
          'socio (Texto, opcional)',
          'city (Texto, opcional)',
          'type (venta o alquiler)',
          'typeProperty (casa, departamento, duplex, finca, local, oficina, lote, terreno)',
          'price (Número)',
          'rooms (Número, opcional)',
          'comision (Número 0-100)',
          'isAvailable (TRUE/FALSE, opcional)',
          'description (Texto, opcional)',
          'escritura (prescripcion en tramite, escritura, prescripcion adjudicada, posesion)',
          'plantType (Texto, opcional - solo fincas)',
          'plantQuantity (Número, opcional - solo fincas)',
          'bathrooms (Número, opcional)',
          'highlights (Texto, opcional)',
          'inventory (Texto, opcional)',
          'superficieCubierta (Texto, opcional)',
          'superficieTotal (Texto, opcional)'
        ]
      }
    }
  });
});

module.exports = router;