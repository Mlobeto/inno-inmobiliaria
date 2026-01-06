const { Router } = require('express');
const ClientDocumentController = require('../controllers/ClientDocumentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { tenancyMiddleware } = require('../middlewares/tenancyMiddleware');

const router = Router();

// Aplicar middlewares de autenticación y multitenancy a todas las rutas
router.use(authMiddleware);
router.use(tenancyMiddleware);

/**
 * @route   GET /api/client/:clientId/documents
 * @desc    Obtener todos los documentos de un cliente
 * @access  Private (requiere JWT y tenant)
 */
router.get('/:clientId/documents', ClientDocumentController.getAllDocuments);

/**
 * @route   GET /api/client/:clientId/documents/primary/:documentType
 * @desc    Obtener el documento primario de un tipo específico
 * @access  Private
 * @example GET /api/client/123/documents/primary/TAX
 */
router.get('/:clientId/documents/primary/:documentType', ClientDocumentController.getPrimaryDocument);

/**
 * @route   GET /api/client/:clientId/documents/:documentId
 * @desc    Obtener un documento específico por ID
 * @access  Private
 */
router.get('/:clientId/documents/:documentId', ClientDocumentController.getDocumentById);

/**
 * @route   POST /api/client/:clientId/documents
 * @desc    Crear un nuevo documento para un cliente
 * @access  Private
 * @body    {
 *            documentType: "TAX" | "IDENTITY" | "PROPERTY" | "INCOME" | "GUARANTEE" | "OTHER",
 *            documentCode: "CUIL" | "DNI" | "CPF" | "RUT" | etc,
 *            number: "20-12345678-9",
 *            country: "AR",
 *            isPrimary: true,
 *            issuedBy: "ANSES",
 *            issuedAt: "2020-01-15",
 *            expiresAt: null,
 *            metadata: {}
 *          }
 */
router.post('/:clientId/documents', ClientDocumentController.createDocument);

/**
 * @route   PUT /api/client/:clientId/documents/:documentId
 * @desc    Actualizar un documento existente
 * @access  Private
 */
router.put('/:clientId/documents/:documentId', ClientDocumentController.updateDocument);

/**
 * @route   DELETE /api/client/:clientId/documents/:documentId
 * @desc    Eliminar un documento (soft delete)
 * @access  Private
 */
router.delete('/:clientId/documents/:documentId', ClientDocumentController.deleteDocument);

/**
 * @route   PATCH /api/client/:clientId/documents/:documentId/verify
 * @desc    Marcar un documento como verificado
 * @access  Private
 */
router.patch('/:clientId/documents/:documentId/verify', ClientDocumentController.verifyDocument);

/**
 * @route   PATCH /api/client/:clientId/documents/:documentId/set-primary
 * @desc    Marcar un documento como primario (desmarca otros del mismo tipo)
 * @access  Private
 */
router.patch('/:clientId/documents/:documentId/set-primary', ClientDocumentController.setPrimaryDocument);

module.exports = router;
