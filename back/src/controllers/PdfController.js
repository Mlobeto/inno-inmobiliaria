const { PdfTemplate, Tenant, Lease, Property, Client, Payment } = require("../data");
const pdfService = require("../services/pdfService");

/**
 * @route POST /api/pdf/generate
 * @desc Genera un PDF usando un template y datos específicos
 * @access Private (requiere tenancyMiddleware)
 */
const generatePdf = async (req, res) => {
  try {
    const { templateType, templateId, dataId, customVariables } = req.body;
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    // Validar parámetros requeridos
    if (!templateType || !dataId) {
      return res.status(400).json({
        success: false,
        message: "templateType y dataId son requeridos",
      });
    }

    // Obtener template (específico o default)
    let template;
    if (templateId) {
      template = await PdfTemplate.findOne({
        where: {
          id: templateId,
          tenantId,
          isActive: true,
        },
      });
    } else {
      // Buscar template por defecto para este tipo
      template = await PdfTemplate.findOne({
        where: {
          tenantId,
          templateType,
          isDefault: true,
          isActive: true,
        },
      });
    }

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template no encontrado",
      });
    }

    // Obtener datos según el tipo de template
    let data;
    switch (templateType) {
      case "CONTRATO_ALQUILER":
        data = await Lease.findOne({
          where: { id: dataId, tenantId },
          include: [
            { model: Property, as: "Property" },
            { model: Client, as: "Renter" },
            { model: Client, as: "Landlord" },
            { model: Client, as: "Garantors" },
          ],
        });
        break;

      case "AUTORIZACION_VENTA":
        data = await Property.findOne({
          where: { propertyId: dataId, tenantId },
          include: [
            { model: Client, as: "Owner" },
          ],
        });
        break;

      case "RECIBO_PAGO":
        data = await Payment.findOne({
          where: { id: dataId },
          include: [
            {
              model: Lease,
              as: "Lease",
              include: [
                { model: Client, as: "Renter" },
                { model: Property, as: "Property" },
              ],
            },
          ],
        });
        break;

      case "FICHA_PROPIEDAD":
        data = await Property.findOne({
          where: { propertyId: dataId, tenantId },
        });
        break;

      case "ACTUALIZACION_RENTA":
        data = await Lease.findOne({
          where: { id: dataId, tenantId },
          include: [
            { model: Property, as: "Property" },
            { model: Client, as: "Renter" },
            { model: Client, as: "Landlord" },
          ],
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Tipo de template no válido",
        });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Datos no encontrados",
      });
    }

    // Obtener datos del tenant para incluir en variables
    const tenant = await Tenant.findByPk(tenantId);

    // Generar PDF
    const pdfUrl = await pdfService.generatePdf({
      template,
      data,
      tenant,
      customVariables: customVariables || {},
    });

    res.status(200).json({
      success: true,
      message: "PDF generado exitosamente",
      data: {
        pdfUrl,
        templateType,
        templateName: template.templateName,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar PDF",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/pdf/templates
 * @desc Lista todos los templates del tenant
 * @access Private
 */
const getTemplates = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { templateType, isActive } = req.query;

    const where = { tenantId };
    if (templateType) where.templateType = templateType;
    if (isActive !== undefined) where.isActive = isActive === "true";

    const templates = await PdfTemplate.findAll({
      where,
      include: [
        {
          model: require("../data").Admin,
          as: "Creator",
          attributes: ["id", "username", "fullName"],
        },
      ],
      order: [["isDefault", "DESC"], ["templateName", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error obteniendo templates:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener templates",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/pdf/templates/:id
 * @desc Obtiene un template específico
 * @access Private
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    const template = await PdfTemplate.findOne({
      where: { id, tenantId },
      include: [
        {
          model: require("../data").Admin,
          as: "Creator",
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Error obteniendo template:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener template",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/pdf/templates
 * @desc Crea un nuevo template
 * @access Private (SUPER_ADMIN only)
 */
const createTemplate = async (req, res) => {
  try {
    const { tenantId, adminId } = req.user; // Obtener tenantId y adminId del token JWT

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
      isDefault,
    } = req.body;

    // Validaciones
    if (!templateType || !templateName || !htmlTemplate) {
      return res.status(400).json({
        success: false,
        message: "templateType, templateName y htmlTemplate son requeridos",
      });
    }

    // Si se marca como default, desmarcar otros defaults del mismo tipo
    if (isDefault) {
      await PdfTemplate.update(
        { isDefault: false },
        {
          where: {
            tenantId,
            templateType,
            isDefault: true,
          },
        }
      );
    }

    const template = await PdfTemplate.create({
      tenantId,
      templateType,
      templateName,
      htmlTemplate,
      styles,
      headerHtml,
      footerHtml,
      variables,
      pageSize: pageSize || "A4",
      orientation: orientation || "portrait",
      margins: margins || { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      isDefault: isDefault || false,
      createdBy: adminId,
    });

    res.status(201).json({
      success: true,
      message: "Template creado exitosamente",
      data: template,
    });
  } catch (error) {
    console.error("Error creando template:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear template",
      error: error.message,
    });
  }
};

/**
 * @route PUT /api/pdf/templates/:id
 * @desc Actualiza un template existente
 * @access Private (SUPER_ADMIN only)
 */
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    const template = await PdfTemplate.findOne({
      where: { id, tenantId },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template no encontrado",
      });
    }

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

    // Si se marca como default, desmarcar otros
    if (isDefault && !template.isDefault) {
      await PdfTemplate.update(
        { isDefault: false },
        {
          where: {
            tenantId,
            templateType: template.templateType,
            isDefault: true,
          },
        }
      );
    }

    await template.update({
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
    });

    res.status(200).json({
      success: true,
      message: "Template actualizado exitosamente",
      data: template,
    });
  } catch (error) {
    console.error("Error actualizando template:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar template",
      error: error.message,
    });
  }
};

/**
 * @route DELETE /api/pdf/templates/:id
 * @desc Elimina (soft delete) un template
 * @access Private (SUPER_ADMIN only)
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    const template = await PdfTemplate.findOne({
      where: { id, tenantId },
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template no encontrado",
      });
    }

    await template.destroy(); // Soft delete (paranoid)

    res.status(200).json({
      success: true,
      message: "Template eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando template:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar template",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/pdf/preview
 * @desc Genera preview de un template con datos de prueba
 * @access Private
 */
const previewTemplate = async (req, res) => {
  try {
    const { templateId, htmlTemplate, styles, headerHtml, footerHtml, sampleData } = req.body;
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    let template;
    
    if (templateId) {
      // Preview de template existente
      template = await PdfTemplate.findOne({
        where: { id: templateId, tenantId },
      });

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template no encontrado",
        });
      }
    } else {
      // Preview de template temporal (sin guardar)
      if (!htmlTemplate) {
        return res.status(400).json({
          success: false,
          message: "htmlTemplate es requerido para preview temporal",
        });
      }

      template = {
        htmlTemplate,
        styles: styles || "",
        headerHtml: headerHtml || "",
        footerHtml: footerHtml || "",
        pageSize: "A4",
        orientation: "portrait",
        margins: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      };
    }

    const tenant = await Tenant.findByPk(tenantId);

    // Generar PDF preview
    const pdfUrl = await pdfService.generatePdf({
      template,
      data: sampleData || {},
      tenant,
      isPreview: true,
    });

    res.status(200).json({
      success: true,
      message: "Preview generado exitosamente",
      data: {
        pdfUrl,
      },
    });
  } catch (error) {
    console.error("Error generando preview:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar preview",
      error: error.message,
    });
  }
};

module.exports = {
  generatePdf,
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
};
