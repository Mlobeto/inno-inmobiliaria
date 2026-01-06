const { ClientDocument, Client, Tenant } = require('../data');
const { Op } = require('sequelize');

/**
 * Controller para gestionar documentos de clientes
 * Soporta múltiples documentos por cliente (identidad, fiscal, etc.)
 */

/**
 * GET /api/client/:clientId/documents
 * Obtener todos los documentos de un cliente
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId } = req.params;

    // Verificar que el cliente pertenece al tenant
    const client = await Client.findOne({
      where: { idClient: clientId, tenantId }
    });

    if (!client) {
      return res.status(404).json({ 
        error: 'Cliente no encontrado o no pertenece a tu inmobiliaria' 
      });
    }

    // Obtener todos los documentos del cliente
    const documents = await ClientDocument.findAll({
      where: {
        clientId,
        tenantId
      },
      order: [
        ['documentType', 'ASC'],
        ['isPrimary', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return res.status(200).json({
      clientId,
      clientName: client.name,
      totalDocuments: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    return res.status(500).json({ 
      error: 'Error al obtener documentos del cliente',
      details: error.message 
    });
  }
};

/**
 * GET /api/client/:clientId/documents/:documentId
 * Obtener un documento específico
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, documentId } = req.params;

    const document = await ClientDocument.findOne({
      where: {
        documentId,
        clientId,
        tenantId
      },
      include: [{
        model: Client,
        attributes: ['idClient', 'name', 'email']
      }]
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error('Error al obtener documento:', error);
    return res.status(500).json({ 
      error: 'Error al obtener el documento',
      details: error.message 
    });
  }
};

/**
 * POST /api/client/:clientId/documents
 * Crear un nuevo documento para un cliente
 */
exports.createDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId } = req.params;
    const {
      documentType,
      country,
      documentCode,
      number,
      issuedBy,
      issuedAt,
      expiresAt,
      isPrimary,
      metadata
    } = req.body;

    // Validar campos requeridos
    if (!documentType || !documentCode || !number) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        required: ['documentType', 'documentCode', 'number']
      });
    }

    // Verificar que el cliente existe y pertenece al tenant
    const client = await Client.findOne({
      where: { idClient: clientId, tenantId }
    });

    if (!client) {
      return res.status(404).json({ 
        error: 'Cliente no encontrado o no pertenece a tu inmobiliaria' 
      });
    }

    // Verificar si ya existe un documento con el mismo número y código
    const existingDoc = await ClientDocument.findOne({
      where: {
        clientId,
        documentCode,
        number,
        tenantId
      }
    });

    if (existingDoc) {
      return res.status(409).json({
        error: 'Ya existe un documento con este número',
        existingDocument: {
          documentId: existingDoc.documentId,
          documentType: existingDoc.documentType,
          documentCode: existingDoc.documentCode
        }
      });
    }

    // Si se marca como primario, desmarcar otros del mismo tipo
    if (isPrimary) {
      await ClientDocument.update(
        { isPrimary: false },
        {
          where: {
            clientId,
            documentType,
            tenantId
          }
        }
      );
    }

    // Crear el documento
    const newDocument = await ClientDocument.create({
      clientId,
      tenantId,
      documentType,
      country: country || 'AR',
      documentCode,
      number,
      issuedBy,
      issuedAt,
      expiresAt,
      isPrimary: isPrimary || false,
      metadata: metadata || {}
    });

    console.log(`✅ Documento creado: ${documentCode} ${number} para cliente ${clientId}`);

    return res.status(201).json({
      message: 'Documento creado exitosamente',
      document: newDocument
    });
  } catch (error) {
    console.error('Error al crear documento:', error);
    
    // Error de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        details: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }

    return res.status(500).json({ 
      error: 'Error al crear el documento',
      details: error.message 
    });
  }
};

/**
 * PUT /api/client/:clientId/documents/:documentId
 * Actualizar un documento existente
 */
exports.updateDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, documentId } = req.params;
    const {
      number,
      issuedBy,
      issuedAt,
      expiresAt,
      isPrimary,
      isVerified,
      metadata
    } = req.body;

    // Buscar el documento
    const document = await ClientDocument.findOne({
      where: {
        documentId,
        clientId,
        tenantId
      }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    // Si se marca como primario, desmarcar otros del mismo tipo
    if (isPrimary && !document.isPrimary) {
      await ClientDocument.update(
        { isPrimary: false },
        {
          where: {
            clientId,
            documentType: document.documentType,
            tenantId,
            documentId: { [Op.ne]: documentId }
          }
        }
      );
    }

    // Actualizar campos
    const updatedFields = {};
    if (number !== undefined) updatedFields.number = number;
    if (issuedBy !== undefined) updatedFields.issuedBy = issuedBy;
    if (issuedAt !== undefined) updatedFields.issuedAt = issuedAt;
    if (expiresAt !== undefined) updatedFields.expiresAt = expiresAt;
    if (isPrimary !== undefined) updatedFields.isPrimary = isPrimary;
    if (isVerified !== undefined) updatedFields.isVerified = isVerified;
    if (metadata !== undefined) updatedFields.metadata = metadata;

    await document.update(updatedFields);

    console.log(`✅ Documento actualizado: ${document.documentCode} ${document.number}`);

    return res.status(200).json({
      message: 'Documento actualizado exitosamente',
      document
    });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    return res.status(500).json({ 
      error: 'Error al actualizar el documento',
      details: error.message 
    });
  }
};

/**
 * DELETE /api/client/:clientId/documents/:documentId
 * Eliminar un documento (soft delete)
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, documentId } = req.params;

    const document = await ClientDocument.findOne({
      where: {
        documentId,
        clientId,
        tenantId
      }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    // Verificar que no sea el único documento primario
    if (document.isPrimary) {
      const otherDocs = await ClientDocument.count({
        where: {
          clientId,
          documentType: document.documentType,
          tenantId,
          documentId: { [Op.ne]: documentId }
        }
      });

      if (otherDocs === 0) {
        return res.status(400).json({
          error: 'No se puede eliminar el único documento de este tipo',
          suggestion: 'Agrega otro documento antes de eliminar este'
        });
      }
    }

    // Soft delete
    await document.destroy();

    console.log(`🗑️ Documento eliminado: ${document.documentCode} ${document.number}`);

    return res.status(200).json({
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    return res.status(500).json({ 
      error: 'Error al eliminar el documento',
      details: error.message 
    });
  }
};

/**
 * PATCH /api/client/:clientId/documents/:documentId/verify
 * Marcar un documento como verificado
 */
exports.verifyDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, documentId } = req.params;

    const document = await ClientDocument.findOne({
      where: {
        documentId,
        clientId,
        tenantId
      }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    await document.verify();

    console.log(`✅ Documento verificado: ${document.documentCode} ${document.number}`);

    return res.status(200).json({
      message: 'Documento verificado exitosamente',
      document
    });
  } catch (error) {
    console.error('Error al verificar documento:', error);
    return res.status(500).json({ 
      error: 'Error al verificar el documento',
      details: error.message 
    });
  }
};

/**
 * PATCH /api/client/:clientId/documents/:documentId/set-primary
 * Marcar un documento como primario
 */
exports.setPrimaryDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, documentId } = req.params;

    const document = await ClientDocument.findOne({
      where: {
        documentId,
        clientId,
        tenantId
      }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    await document.setPrimary();

    console.log(`⭐ Documento marcado como primario: ${document.documentCode} ${document.number}`);

    return res.status(200).json({
      message: 'Documento marcado como primario',
      document
    });
  } catch (error) {
    console.error('Error al marcar documento como primario:', error);
    return res.status(500).json({ 
      error: 'Error al marcar el documento como primario',
      details: error.message 
    });
  }
};

/**
 * GET /api/client/:clientId/documents/primary/:documentType
 * Obtener el documento primario de un tipo específico
 */
exports.getPrimaryDocument = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { clientId, documentType } = req.params;

    const document = await ClientDocument.findOne({
      where: {
        clientId,
        tenantId,
        documentType,
        isPrimary: true
      }
    });

    if (!document) {
      return res.status(404).json({ 
        error: `No se encontró documento primario de tipo ${documentType}` 
      });
    }

    return res.status(200).json(document);
  } catch (error) {
    console.error('Error al obtener documento primario:', error);
    return res.status(500).json({ 
      error: 'Error al obtener el documento primario',
      details: error.message 
    });
  }
};
