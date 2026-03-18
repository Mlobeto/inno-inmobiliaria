const prisma = require('../utils/prismaClient');

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

    const client = await prisma.Clients.findFirst({
      where: { idClient: parseInt(clientId), tenantId }
    });

    if (!client) {
      return res.status(404).json({ 
        error: 'Cliente no encontrado o no pertenece a tu inmobiliaria' 
      });
    }

    const documents = await prisma.client_documents.findMany({
      where: {
        client_id: parseInt(clientId),
        tenant_id: tenantId,
      },
      orderBy: [
        { document_type: 'asc' },
        { is_primary: 'desc' },
        { created_at: 'desc' },
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

    const document = await prisma.client_documents.findFirst({
      where: {
        document_id: parseInt(documentId),
        client_id: parseInt(clientId),
        tenant_id: tenantId,
      },
      include: { Clients: { select: { idClient: true, name: true, email: true } } }
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

    const client = await prisma.Clients.findFirst({
      where: { idClient: parseInt(clientId), tenantId }
    });

    if (!client) {
      return res.status(404).json({ 
        error: 'Cliente no encontrado o no pertenece a tu inmobiliaria' 
      });
    }

    // Verificar si ya existe un documento con el mismo número y código
    const existingDoc = await prisma.client_documents.findFirst({
      where: {
        client_id: parseInt(clientId),
        document_code: documentCode,
        number,
        tenant_id: tenantId,
      }
    });

    if (existingDoc) {
      return res.status(409).json({
        error: 'Ya existe un documento con este número',
        existingDocument: {
          documentId: existingDoc.document_id,
          documentType: existingDoc.document_type,
          documentCode: existingDoc.document_code,
        }
      });
    }

    // Si se marca como primario, desmarcar otros del mismo tipo
    if (isPrimary) {
      await prisma.client_documents.updateMany({
        where: { client_id: parseInt(clientId), document_type: documentType, tenant_id: tenantId },
        data: { is_primary: false },
      });
    }

    // Crear el documento
    const newDocument = await prisma.client_documents.create({
      data: {
        client_id: parseInt(clientId),
        tenant_id: tenantId,
        document_type: documentType,
        country: country || 'AR',
        document_code: documentCode,
        number,
        issued_by: issuedBy,
        issued_at: issuedAt,
        expires_at: expiresAt,
        is_primary: isPrimary || false,
        metadata: metadata || {},
      }
    });

    console.log(`✅ Documento creado: ${documentCode} ${number} para cliente ${clientId}`);

    return res.status(201).json({
      message: 'Documento creado exitosamente',
      document: newDocument
    });
  } catch (error) {
    console.error('Error al crear documento:', error);
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

    const document = await prisma.client_documents.findFirst({
      where: { document_id: parseInt(documentId), client_id: parseInt(clientId), tenant_id: tenantId }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    // Si se marca como primario, desmarcar otros del mismo tipo
    if (isPrimary && !document.is_primary) {
      await prisma.client_documents.updateMany({
        where: {
          client_id: parseInt(clientId),
          document_type: document.document_type,
          tenant_id: tenantId,
          document_id: { not: parseInt(documentId) },
        },
        data: { is_primary: false },
      });
    }

    // Actualizar campos
    const updatedFields = {};
    if (number !== undefined) updatedFields.number = number;
    if (issuedBy !== undefined) updatedFields.issued_by = issuedBy;
    if (issuedAt !== undefined) updatedFields.issued_at = issuedAt;
    if (expiresAt !== undefined) updatedFields.expires_at = expiresAt;
    if (isPrimary !== undefined) updatedFields.is_primary = isPrimary;
    if (isVerified !== undefined) updatedFields.is_verified = isVerified;
    if (metadata !== undefined) updatedFields.metadata = metadata;

    const updated = await prisma.client_documents.update({
      where: { document_id: parseInt(documentId) },
      data: updatedFields,
    });

    console.log(`✅ Documento actualizado: ${document.document_code} ${document.number}`);

    return res.status(200).json({
      message: 'Documento actualizado exitosamente',
      document: updated
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

    const document = await prisma.client_documents.findFirst({
      where: { document_id: parseInt(documentId), client_id: parseInt(clientId), tenant_id: tenantId }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    // Verificar que no sea el único documento primario
    if (document.is_primary) {
      const otherDocs = await prisma.client_documents.count({
        where: {
          client_id: parseInt(clientId),
          document_type: document.document_type,
          tenant_id: tenantId,
          document_id: { not: parseInt(documentId) },
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
    await prisma.client_documents.delete({ where: { document_id: parseInt(documentId) } });

    console.log(`🗑️ Documento eliminado: ${document.document_code} ${document.number}`);

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

    const document = await prisma.client_documents.findFirst({
      where: { document_id: parseInt(documentId), client_id: parseInt(clientId), tenant_id: tenantId }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    const updated = await prisma.client_documents.update({
      where: { document_id: parseInt(documentId) },
      data: { is_verified: true },
    });

    console.log(`✅ Documento verificado: ${document.document_code} ${document.number}`);

    return res.status(200).json({
      message: 'Documento verificado exitosamente',
      document: updated
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

    const document = await prisma.client_documents.findFirst({
      where: { document_id: parseInt(documentId), client_id: parseInt(clientId), tenant_id: tenantId }
    });

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    // Desmarcar otros del mismo tipo
    await prisma.client_documents.updateMany({
      where: {
        client_id: parseInt(clientId),
        document_type: document.document_type,
        tenant_id: tenantId,
        document_id: { not: parseInt(documentId) },
      },
      data: { is_primary: false },
    });
    const updated = await prisma.client_documents.update({
      where: { document_id: parseInt(documentId) },
      data: { is_primary: true },
    });

    console.log(`⭐ Documento marcado como primario: ${document.document_code} ${document.number}`);

    return res.status(200).json({
      message: 'Documento marcado como primario',
      document: updated
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

    const document = await prisma.client_documents.findFirst({
      where: {
        client_id: parseInt(clientId),
        tenant_id: tenantId,
        document_type: documentType,
        is_primary: true,
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
