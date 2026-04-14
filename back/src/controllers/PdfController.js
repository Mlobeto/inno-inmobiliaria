const prisma = require('../utils/prismaClient');
const pdfService = require('../services/pdfService');
const { createDefaultTemplatesForTenant } = require('../scripts/seedPdfTemplates');

async function getLeasePdfData(tenantId, dataId) {
  const lease = await prisma.Leases.findFirst({ where: { id: Number(dataId), tenantId } });
  if (!lease) return null;

  const [property, renter, landlord, garantors] = await Promise.all([
    prisma.Property.findUnique({ where: { propertyId: lease.propertyId } }),
    prisma.Clients.findUnique({ where: { idClient: lease.renterId } }),
    prisma.Clients.findUnique({ where: { idClient: lease.landlordId } }),
    prisma.Garantors.findMany({ where: { leaseId: lease.id } }),
  ]);

  return {
    ...lease,
    Property: property,
    Renter: renter,
    Landlord: landlord,
    Garantors: garantors,
  };
}

const generatePdf = async (req, res) => {
  try {
    const { templateType, templateId, dataId, customVariables } = req.body;
    const { tenantId } = req.user;

    if (!templateType || !dataId) {
      return res.status(400).json({
        success: false,
        message: 'templateType y dataId son requeridos',
      });
    }

    let template;
    if (templateId) {
      template = await prisma.pdf_templates.findFirst({
        where: { id: Number(templateId), tenantId, isActive: true, deletedAt: null },
      });
    } else {
      template = await prisma.pdf_templates.findFirst({
        where: { tenantId, templateType, isDefault: true, isActive: true, deletedAt: null },
      });
    }

    if (!template) {
      // Auto-seed templates por defecto para este tenant y reintentar
      await createDefaultTemplatesForTenant(tenantId);
      if (templateId) {
        template = await prisma.pdf_templates.findFirst({
          where: { id: Number(templateId), tenantId, isActive: true, deletedAt: null },
        });
      } else {
        template = await prisma.pdf_templates.findFirst({
          where: { tenantId, templateType, isDefault: true, isActive: true, deletedAt: null },
        });
      }
    }

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    let data;
    switch (templateType) {
      case 'CONTRATO_ALQUILER':
      case 'ACTUALIZACION_RENTA':
        data = await getLeasePdfData(tenantId, dataId);
        break;
      case 'AUTORIZACION_VENTA': {
        const property = await prisma.Property.findFirst({ where: { propertyId: Number(dataId), tenantId } });
        if (!property) {
          data = null;
          break;
        }
        const ownerRelation = await prisma.ClientProperties.findFirst({
          where: { propertyId: property.propertyId, tenantId, role: 'propietario' },
        });
        const owner = ownerRelation
          ? await prisma.Clients.findUnique({ where: { idClient: ownerRelation.clientId } })
          : null;
        data = { ...property, Owner: owner };
        break;
      }
      case 'RECIBO_PAGO': {
        const payment = await prisma.PaymentReceipts.findFirst({ where: { id: Number(dataId) } });
        if (!payment) {
          data = null;
          break;
        }
        const lease = payment.leaseId ? await getLeasePdfData(tenantId, payment.leaseId) : null;
        data = { ...payment, Lease: lease };
        break;
      }
      case 'FICHA_PROPIEDAD':
        data = await prisma.Property.findFirst({ where: { propertyId: Number(dataId), tenantId } });
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de template no válido' });
    }

    if (!data) {
      return res.status(404).json({ success: false, message: 'Datos no encontrados' });
    }

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });

    const pdfUrl = await pdfService.generatePdf({
      template,
      data,
      tenant,
      customVariables: customVariables || {},
    });

    res.status(200).json({
      success: true,
      message: 'PDF generado exitosamente',
      data: {
        pdfUrl,
        templateType,
        templateName: template.templateName,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar PDF', error: error.message });
  }
};

const getTemplates = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { templateType, isActive } = req.query;

    const where = { tenantId, deletedAt: null };
    if (templateType) where.templateType = templateType;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.pdf_templates.findMany({
      where,
      include: {
        admins: {
          select: { adminId: true, username: true, fullName: true },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { templateName: 'asc' }],
    });

    res.status(200).json({ success: true, data: templates.map((t) => ({ ...t, Creator: t.admins })) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener templates', error: error.message });
  }
};

const getTemplateById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tenantId } = req.user;

    const template = await prisma.pdf_templates.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        admins: {
          select: { adminId: true, username: true, fullName: true },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    res.status(200).json({ success: true, data: { ...template, Creator: template.admins } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener template', error: error.message });
  }
};

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
      isDefault,
    } = req.body;

    if (!templateType || !templateName || !htmlTemplate) {
      return res.status(400).json({
        success: false,
        message: 'templateType, templateName y htmlTemplate son requeridos',
      });
    }

    if (isDefault) {
      await prisma.pdf_templates.updateMany({
        where: { tenantId, templateType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.pdf_templates.create({
      data: {
        tenantId,
        templateType,
        templateName,
        htmlTemplate,
        styles,
        headerHtml,
        footerHtml,
        variables,
        pageSize: pageSize || 'A4',
        orientation: orientation || 'portrait',
        margins: margins || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
        isDefault: isDefault || false,
        createdBy: adminId,
      },
    });

    res.status(201).json({ success: true, message: 'Template creado exitosamente', data: template });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear template', error: error.message });
  }
};

const updateTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tenantId } = req.user;

    const template = await prisma.pdf_templates.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
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

    if (isDefault && !template.isDefault) {
      await prisma.pdf_templates.updateMany({
        where: { tenantId, templateType: template.templateType, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.pdf_templates.update({
      where: { id },
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

    res.status(200).json({ success: true, message: 'Template actualizado exitosamente', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al actualizar template', error: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tenantId } = req.user;

    const template = await prisma.pdf_templates.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template no encontrado' });
    }

    await prisma.pdf_templates.update({ where: { id }, data: { deletedAt: new Date() } });
    res.status(200).json({ success: true, message: 'Template eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al eliminar template', error: error.message });
  }
};

const previewTemplate = async (req, res) => {
  try {
    const { templateId, htmlTemplate, styles, headerHtml, footerHtml, sampleData } = req.body;
    const { tenantId } = req.user;

    let template;
    if (templateId) {
      template = await prisma.pdf_templates.findFirst({
        where: { id: Number(templateId), tenantId, deletedAt: null },
      });

      if (!template) {
        return res.status(404).json({ success: false, message: 'Template no encontrado' });
      }
    } else {
      if (!htmlTemplate) {
        return res.status(400).json({ success: false, message: 'htmlTemplate es requerido para preview temporal' });
      }

      template = {
        htmlTemplate,
        styles: styles || '',
        headerHtml: headerHtml || '',
        footerHtml: footerHtml || '',
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      };
    }

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });

    const pdfUrl = await pdfService.generatePdf({
      template,
      data: sampleData || {},
      tenant,
      isPreview: true,
    });

    res.status(200).json({ success: true, message: 'Preview generado exitosamente', data: { pdfUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al generar preview', error: error.message });
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
