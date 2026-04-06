const prisma = require("../utils/prismaClient");
const { renderTemplate, prepareTemplateVariables } = require("../services/pdfService");

/**
 * Tipos de propiedad comerciales
 */
const COMMERCIAL_PROPERTY_TYPES = ['oficina', 'local', 'galpon', 'deposito', 'finca', 'cochera'];

/**
 * Mapeo de tipo de propiedad → propósito de la plantilla.
 * VIVIENDA, COMERCIAL, TERRENO, o null si no se reconoce.
 */
const PROPERTY_PURPOSE_TYPES = {
  VIVIENDA: ['casa', 'departamento', 'duplex'],
  COMERCIAL: ['oficina', 'local', 'galpon', 'deposito', 'finca', 'cochera'],
  TERRENO: ['lote', 'terreno'],
};

const getPropertyPurpose = (typeProperty) => {
  if (!typeProperty) return null;
  const tp = typeProperty.toLowerCase();
  for (const [purpose, types] of Object.entries(PROPERTY_PURPOSE_TYPES)) {
    if (types.includes(tp)) return purpose;
  }
  return null;
};

/**
 * Determina el tipo de plantilla más apropiado según el tipo de propiedad y duración del contrato.
 * - Contratos <= 3 meses → CONTRATO_ALQUILER_TEMPORARIO
 * - Propiedades comerciales → CONTRATO_ALQUILER (mismo tipo, pero el título varía desde la plantilla)
 * - Default → CONTRATO_ALQUILER
 */
const determineTemplateType = (typeProperty, totalMonths) => {
  const months = parseInt(totalMonths, 10);
  if (!isNaN(months) && months <= 3) {
    return 'CONTRATO_ALQUILER_TEMPORARIO';
  }
  // Los contratos comerciales comparten tipo con los residenciales; la plantilla puede
  // diferenciar con condicionales Handlebars sobre property.typeProperty.
  return 'CONTRATO_ALQUILER';
};

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
      propertyPurpose,
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

    // Si se marca como default, quitar el default de otras plantillas del mismo tipo y propósito
    if (isDefault) {
      await prisma.pdf_templates.updateMany({
        where: {
          tenantId,
          templateType,
          propertyPurpose: propertyPurpose || null,
        },
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
        propertyPurpose: propertyPurpose || null,
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
      propertyPurpose,
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

    // Propósito final (puede venir del body o mantenerse igual)
    const finalPurpose = propertyPurpose !== undefined
      ? (propertyPurpose || null)
      : template.propertyPurpose;

    // Si se marca como default, quitar el default de otras plantillas del mismo tipo y propósito
    if (isDefault && !template.isDefault) {
      await prisma.pdf_templates.updateMany({
        where: {
          tenantId,
          templateType: template.templateType,
          propertyPurpose: finalPurpose,
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
        propertyPurpose: finalPurpose,
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
        propertyPurpose: originalTemplate.propertyPurpose,
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

    // Quitar default de otras plantillas del mismo tipo y propósito
    await prisma.pdf_templates.updateMany({
      where: {
        tenantId,
        templateType: template.templateType,
        propertyPurpose: template.propertyPurpose,
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
        value: "ACTUALIZACION_ALQUILER",
        label: "Actualización de Alquiler",
        description: "Documento de actualización de monto de alquiler",
        variables: [
          "landlord.name", "landlord.cuil",
          "tenant.name", "tenant.cuil",
          "property.address", "property.city",
          "lease.rentAmount", "newRentAmount", "porcentajeAumento",
          "updateDate", "periodo"
        ]
      },
      {
        value: "CONTRATO_ALQUILER_TEMPORARIO",
        label: "Contrato de Alquiler Temporario",
        description: "Contrato de locación temporaria para turismo/temporada (Art. 1199 CCyCN)",
        variables: [
          "propietario.nombre", "propietario.cuil", "propietario.domicilio",
          "inquilino.nombre", "inquilino.cuil", "inquilino.ciudadOrigen",
          "inquilino.telefono", "inquilino.cantPersonas",
          "property.address", "property.city", "property.province",
          "contrato.fechaInicio", "contrato.fechaFin", "contrato.cantidadDias",
          "contrato.montoTotal", "contrato.montoPorDia", "contrato.deposito",
          "contrato.horaIngreso", "contrato.horaEgreso",
          "contrato.serviciosIncluidos", "contrato.reglas",
          "inmobiliaria.businessName", "inmobiliaria.phone", "inmobiliaria.email"
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

/**
 * @route GET /api/pdf-templates/render/lease/:leaseId
 * @desc Renderizar la plantilla por defecto del tenant con los datos del lease.
 *       Selección inteligente: detecta si es temporario (≤3 meses) y busca primero
 *       la plantilla del tipo específico; si no existe, cae a CONTRATO_ALQUILER.
 * @access Private
 */
const renderForLease = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { leaseId } = req.params;
    const { templateId } = req.query; // permite solicitar una plantilla específica

    // Obtener el lease con todas las relaciones necesarias
    const lease = await prisma.Leases.findFirst({
      where: { id: parseInt(leaseId), tenantId, deletedAt: null },
      include: {
        Property: true,
        Clients_Leases_renterIdToClients: true,
        Clients_Leases_landlordIdToClients: true,
        Garantors: true,
      },
    });

    if (!lease) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado',
      });
    }

    let template = null;
    let usedType;

    // Si se solicita una plantilla específica, verificar que pertenezca al tenant
    if (templateId) {
      template = await prisma.pdf_templates.findFirst({
        where: {
          id: parseInt(templateId),
          tenantId,
          isActive: true,
          deletedAt: null,
        },
      });
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Plantilla específica no encontrada o inactiva',
        });
      }
      usedType = template.templateType;
    } else {
      // Determinar el tipo de plantilla más adecuado
      const suggestedType = determineTemplateType(
        lease.Property?.typeProperty,
        lease.totalMonths
      );

      // Determinar el propósito según el tipo de propiedad
      const propertyPurpose = getPropertyPurpose(lease.Property?.typeProperty);

      // Cadena de búsqueda con prioridad decreciente:
      // 1. templateType exacto + propertyPurpose exacto
      // 2. templateType exacto + sin propósito (null = todos)
      // 3. CONTRATO_ALQUILER + propertyPurpose exacto (si suggestedType era distinto)
      // 4. CONTRATO_ALQUILER + sin propósito

      const candidateQueries = [
        // #1 — tipo exacto + propósito exacto
        propertyPurpose
          ? { tenantId, templateType: suggestedType, propertyPurpose, isDefault: true, isActive: true, deletedAt: null }
          : null,
        // #2 — tipo exacto + propósito null (genérico)
        { tenantId, templateType: suggestedType, propertyPurpose: null, isDefault: true, isActive: true, deletedAt: null },
      ];

      if (suggestedType !== 'CONTRATO_ALQUILER') {
        candidateQueries.push(
          // #3 — CONTRATO_ALQUILER + propósito exacto
          propertyPurpose
            ? { tenantId, templateType: 'CONTRATO_ALQUILER', propertyPurpose, isDefault: true, isActive: true, deletedAt: null }
            : null,
          // #4 — CONTRATO_ALQUILER + propósito null
          { tenantId, templateType: 'CONTRATO_ALQUILER', propertyPurpose: null, isDefault: true, isActive: true, deletedAt: null }
        );
      }

      usedType = suggestedType;
      for (const query of candidateQueries) {
        if (!query) continue;
        template = await prisma.pdf_templates.findFirst({ where: query });
        if (template) {
          usedType = query.templateType;
          break;
        }
      }

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'No hay plantilla de contrato configurada como predeterminada',
          suggestedType,
          propertyPurpose,
        });
      }
    }

    // Normalizar relaciones para prepareTemplateVariables
    const leaseData = {
      ...lease,
      Renter: lease.Clients_Leases_renterIdToClients,
      Landlord: lease.Clients_Leases_landlordIdToClients,
    };

    // Obtener datos del tenant
    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });

    const variables = prepareTemplateVariables(leaseData, tenant);
    const html = renderTemplate(template, variables);

    const suggestedType = templateId
      ? usedType
      : determineTemplateType(lease.Property?.typeProperty, lease.totalMonths);

    res.json({
      success: true,
      html,
      templateUsed: {
        id: template.id,
        name: template.templateName,
        type: usedType,
        propertyPurpose: template.propertyPurpose || null,
        isFallback: !templateId && usedType !== suggestedType,
        suggestedType,
      },
    });
  } catch (error) {
    console.error('Error al renderizar plantilla para lease:', error);
    res.status(500).json({
      success: false,
      message: 'Error al renderizar la plantilla',
      error: error.message,
    });
  }
};

/**
 * @route GET /api/pdf-templates/check
 * @desc Verificar si el tenant tiene plantillas activas de un tipo dado.
 *       Útil para mostrar advertencias en el formulario de creación de contratos.
 * @access Private
 * @queryParam templateType (string, requerido)
 */
const checkTemplates = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { templateType, propertyPurpose } = req.query;

    if (!templateType) {
      return res.status(400).json({
        success: false,
        message: 'El parámetro templateType es requerido',
      });
    }

    // Buscar plantillas que aplican al propósito indicado:
    // - Las que tienen el propósito exacto (si se indicó uno)
    // - Las que son genéricas (propertyPurpose null = todos)
    const where = {
      tenantId,
      templateType,
      isActive: true,
      deletedAt: null,
    };

    if (propertyPurpose) {
      where.OR = [
        { propertyPurpose },
        { propertyPurpose: null },
      ];
    }

    const templates = await prisma.pdf_templates.findMany({
      where,
      select: { id: true, templateName: true, isDefault: true, propertyPurpose: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    res.json({
      success: true,
      templateType,
      propertyPurpose: propertyPurpose || null,
      hasTemplates: templates.length > 0,
      count: templates.length,
      templates,
    });
  } catch (error) {
    console.error('Error al verificar plantillas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar plantillas',
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
  renderForLease,
  checkTemplates,
};
