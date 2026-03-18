const prisma = require("../utils/prismaClient");

/**
 * @route GET /api/pdf-templates
 * @desc Obtener todas las plantillas del tenant
 * @access Private (requiere tenancyMiddleware)
 */
const getAllTemplates = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { templateType, isActive } = req.query;

    const where = { tenantId };
    
    if (templateType) {
      where.templateType = templateType;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const templates = await prisma.pdf_templates.findMany({
      where: { ...where, deletedAt: null },
      include: {
        admins: {
          select: { adminId: true, fullName: true, email: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      success: true,
      data: templates.map((t) => ({ ...t, Creator: t.admins })),
    });
  } catch (error) {
    console.error("Error al obtener plantillas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener plantillas",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/pdf-templates/:id
 * @desc Obtener una plantilla específica
 * @access Private (requiere tenancyMiddleware)
 */
const getTemplateById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const template = await prisma.pdf_templates.findFirst({
      where: { id: parseInt(id), tenantId, deletedAt: null },
      include: {
        admins: {
          select: { adminId: true, fullName: true, email: true },
        },
      },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Plantilla no encontrada",
      });
    }

    res.json({
      success: true,
      data: { ...template, Creator: template.admins },
    });
  } catch (error) {
    console.error("Error al obtener plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener plantilla",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/pdf-templates
 * @desc Crear una nueva plantilla
 * @access Private (requiere tenancyMiddleware)
 */
const createTemplate = async (req, res) => {
  try {
    const { tenantId, adminId } = req.user;
    const {
      templateType,
      templateName,
      htmlTemplate,
      styles,
      headerHtml,
      footerHtml,
      variables,
      pageSize,
      orientation,
      margins,
      isActive,
      isDefault,
    } = req.body;

    // Validar campos requeridos
    if (!templateType || !templateName || !htmlTemplate) {
      return res.status(400).json({
        success: false,
        message: "templateType, templateName y htmlTemplate son requeridos",
      });
    }

    // Si se marca como default, quitar el default de otras plantillas del mismo tipo
    if (isDefault) {
      await prisma.pdf_templates.updateMany({
        where: { tenantId, templateType },
        data: { isDefault: false },
      });
    }

    const template = await prisma.pdf_templates.create({
      data: {
        tenantId,
        templateType,
        templateName,
        htmlTemplate,
        styles: styles || null,
        headerHtml: headerHtml || null,
        footerHtml: footerHtml || null,
        variables: variables || {},
        pageSize: pageSize || "A4",
        orientation: orientation || "portrait",
        margins: margins || { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false,
        createdBy: adminId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Plantilla creada exitosamente",
      data: template,
    });
  } catch (error) {
    console.error("Error al crear plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear plantilla",
      error: error.message,
    });
  }
};

/**
 * @route PUT /api/pdf-templates/:id
 * @desc Actualizar una plantilla existente
 * @access Private (requiere tenancyMiddleware)
 */
const updateTemplate = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const {
      templateName,
      htmlTemplate,
      styles,
      headerHtml,
      footerHtml,
      variables,
      pageSize,
      orientation,
      margins,
      isActive,
      isDefault,
    } = req.body;

    const template = await prisma.pdf_templates.findFirst({
      where: { id: parseInt(id), tenantId, deletedAt: null },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Plantilla no encontrada",
      });
    }

    // Si se marca como default, quitar el default de otras plantillas del mismo tipo
    if (isDefault && !template.isDefault) {
      await prisma.pdf_templates.updateMany({
        where: {
          tenantId,
          templateType: template.templateType,
          id: { not: parseInt(id) },
        },
        data: { isDefault: false },
      });
    }

    // Actualizar plantilla
    const updated = await prisma.pdf_templates.update({
      where: { id: parseInt(id) },
      data: {
        templateName: templateName || template.templateName,
        htmlTemplate: htmlTemplate || template.htmlTemplate,
        styles: styles !== undefined ? styles : template.styles,
        headerHtml: headerHtml !== undefined ? headerHtml : template.headerHtml,
        footerHtml: footerHtml !== undefined ? footerHtml : template.footerHtml,
        variables: variables || template.variables,
        pageSize: pageSize || template.pageSize,
        orientation: orientation || template.orientation,
        margins: margins || template.margins,
        isActive: isActive !== undefined ? isActive : template.isActive,
        isDefault: isDefault !== undefined ? isDefault : template.isDefault,
      },
    });

    res.json({
      success: true,
      message: "Plantilla actualizada exitosamente",
      data: updated,
    });
  } catch (error) {
    console.error("Error al actualizar plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar plantilla",
      error: error.message,
    });
  }
};

/**
 * @route DELETE /api/pdf-templates/:id
 * @desc Eliminar una plantilla (soft delete)
 * @access Private (requiere tenancyMiddleware)
 */
const deleteTemplate = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const template = await prisma.pdf_templates.findFirst({
      where: { id: parseInt(id), tenantId, deletedAt: null },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Plantilla no encontrada",
      });
    }

    // Soft delete
    await prisma.pdf_templates.update({
      where: { id: parseInt(id) },
      data: { deletedAt: new Date() },
    });

    res.json({
      success: true,
      message: "Plantilla eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar plantilla",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/pdf-templates/:id/duplicate
 * @desc Duplicar una plantilla existente
 * @access Private (requiere tenancyMiddleware)
 */
const duplicateTemplate = async (req, res) => {
  try {
    const { tenantId, adminId } = req.user;
    const { id } = req.params;
    const { templateName } = req.body;

    const originalTemplate = await prisma.pdf_templates.findFirst({
      where: { id: parseInt(id), tenantId, deletedAt: null },
    });

    if (!originalTemplate) {
      return res.status(404).json({
        success: false,
        message: "Plantilla no encontrada",
      });
    }

    const duplicatedTemplate = await prisma.pdf_templates.create({
      data: {
        tenantId,
        templateType: originalTemplate.templateType,
        templateName: templateName || `${originalTemplate.templateName} (Copia)`,
        htmlTemplate: originalTemplate.htmlTemplate,
        styles: originalTemplate.styles,
        headerHtml: originalTemplate.headerHtml,
        footerHtml: originalTemplate.footerHtml,
        variables: originalTemplate.variables,
        pageSize: originalTemplate.pageSize,
        orientation: originalTemplate.orientation,
        margins: originalTemplate.margins,
        isActive: false, // La copia empieza inactiva
        isDefault: false, // La copia no puede ser default
        createdBy: adminId,
      },
    });

    res.status(201).json({
      success: true,
      message: "Plantilla duplicada exitosamente",
      data: duplicatedTemplate,
    });
  } catch (error) {
    console.error("Error al duplicar plantilla:", error);
    res.status(500).json({
      success: false,
      message: "Error al duplicar plantilla",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/pdf-templates/:id/set-default
 * @desc Marcar una plantilla como predeterminada
 * @access Private (requiere tenancyMiddleware)
 */
const setAsDefault = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const template = await prisma.pdf_templates.findFirst({
      where: { id: parseInt(id), tenantId, deletedAt: null },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Plantilla no encontrada",
      });
    }

    // Quitar default de otras plantillas del mismo tipo
    await prisma.pdf_templates.updateMany({
      where: {
        tenantId,
        templateType: template.templateType,
        id: { not: parseInt(id) },
      },
      data: { isDefault: false },
    });

    // Marcar esta como default
    const updated = await prisma.pdf_templates.update({
      where: { id: parseInt(id) },
      data: { isDefault: true },
    });

    res.json({
      success: true,
      message: "Plantilla marcada como predeterminada",
      data: updated,
    });
  } catch (error) {
    console.error("Error al marcar plantilla como predeterminada:", error);
    res.status(500).json({
      success: false,
      message: "Error al marcar plantilla como predeterminada",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/pdf-templates/types
 * @desc Obtener los tipos de plantillas disponibles
 * @access Private (requiere tenancyMiddleware)
 */
const getTemplateTypes = async (req, res) => {
  try {
    const types = [
      {
        value: "CONTRATO_ALQUILER",
        label: "Contrato de Alquiler",
        description: "Contrato estándar de locación de inmuebles",
        variables: [
          "landlord.name", "landlord.cuil", "landlord.direccion",
          "tenant.name", "tenant.cuil", "tenant.direccion",
          "property.address", "property.city", "property.typeProperty",
          "lease.rentAmount", "lease.startDate", "lease.totalMonths",
          "guarantors", "inmobiliaria.businessName"
        ]
      },
      {
        value: "AUTORIZACION_VENTA",
        label: "Autorización de Venta",
        description: "Documento de autorización para venta de inmueble",
        variables: [
          "client.name", "client.cuil",
          "property.description", "property.address", "property.city", "property.price",
          "inmobiliaria.businessName", "inmobiliaria.phone", "inmobiliaria.address"
        ]
      },
      {
        value: "RECIBO_PAGO",
        label: "Recibo de Pago",
        description: "Recibo oficial de pagos de alquiler",
        variables: [
          "payment.id", "payment.amount", "payment.paymentDate", "payment.concept",
          "tenant.name", "tenant.phone", "tenant.direccion",
          "inmobiliaria.businessName", "inmobiliaria.cuit"
        ]
      },
      {
        value: "FICHA_PROPIEDAD",
        label: "Ficha de Propiedad",
        description: "Ficha descriptiva de propiedad para marketing",
        variables: [
          "property.address", "property.city", "property.type", "property.price",
          "property.typeProperty", "property.rooms", "property.bathrooms",
          "property.description", "property.images",
          "inmobiliaria.businessName", "inmobiliaria.phone"
        ]
      },
      {
        value: "ACTUALIZACION_RENTA",
        label: "Actualización de Renta",
        description: "Documento de actualización de monto de alquiler",
        variables: [
          "landlord.name", "landlord.cuil",
          "tenant.name", "tenant.cuil",
          "property.address", "property.city",
          "lease.rentAmount", "newRentAmount", "porcentajeAumento",
          "updateDate", "periodo"
        ]
      }
    ];

    res.json({
      success: true,
      data: types,
    });
  } catch (error) {
    console.error("Error al obtener tipos de plantillas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tipos de plantillas",
      error: error.message,
    });
  }
};

module.exports = {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  duplicateTemplate,
  setAsDefault,
  getTemplateTypes,
};
