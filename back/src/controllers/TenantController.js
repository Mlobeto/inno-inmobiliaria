const prisma = require("../utils/prismaClient");
const azureBlobHelper = require("../utils/azureBlobHelper");
const { invalidateTenantCache } = require('../utils/tenantCache');
const logger = require('../utils/logger');

/**
 * @route POST /api/tenant/signature
 * @desc Sube o actualiza la firma digital del tenant
 * @access Private (SUPER_ADMIN only)
 */
const uploadSignature = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { signatureDataUrl } = req.body;

    if (!signatureDataUrl) {
      return res.status(400).json({
        success: false,
        message: "signatureDataUrl es requerido (base64 data URL)",
      });
    }

    // Validar que sea una imagen válida
    if (!signatureDataUrl.startsWith("data:image/")) {
      return res.status(400).json({
        success: false,
        message: "El archivo debe ser una imagen válida",
      });
    }

    // Obtener tenant
    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    // Si ya tiene una firma anterior, eliminarla de Azure Blob
    if (tenant.signatureUrl) {
      try {
        await azureBlobHelper.deleteFile(tenant.signatureUrl);
      } catch (error) {
        logger.warn('No se pudo eliminar la firma anterior de Azure Blob', { tenantId, error: error.message });
      }
    }

    // Subir nueva firma a Azure Blob Storage (base64)
    const result = await azureBlobHelper.uploadFromBase64(
      signatureDataUrl,
      tenantId,
      "signatures",
      { filename: `signature-tenant-${tenantId}.png` }
    );

    // Actualizar tenant con la nueva URL
    await prisma.tenants.update({
      where: { tenantId },
      data: { signatureUrl: result.url },
    });

    await invalidateTenantCache(tenantId, tenant.subdomain, tenant.custom_domain);

    res.status(200).json({
      success: true,
      message: "Firma digital actualizada exitosamente",
      data: {
        signatureUrl: result.secure_url,
      },
    });
  } catch (error) {
    logger.error('Error subiendo firma digital', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al subir la firma digital",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/tenant/signature
 * @desc Obtiene la firma digital del tenant
 * @access Private
 */
const getSignature = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    const tenant = await prisma.tenants.findUnique({
      where: { tenantId },
      select: { signatureUrl: true },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        signatureUrl: tenant.signatureUrl || null,
      },
    });
  } catch (error) {
    logger.error('Error obteniendo firma digital', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al obtener la firma digital",
      error: error.message,
    });
  }
};

/**
 * @route DELETE /api/tenant/signature
 * @desc Elimina la firma digital del tenant
 * @access Private (SUPER_ADMIN only)
 */
const deleteSignature = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    if (!tenant.signatureUrl) {
      return res.status(404).json({
        success: false,
        message: "No hay firma digital para eliminar",
      });
    }

    // Eliminar de Azure Blob
    try {
      await azureBlobHelper.deleteFile(tenant.signatureUrl);
    } catch (error) {
      logger.warn('No se pudo eliminar firma de Azure Blob', { tenantId, error: error.message });
    }

    // Actualizar tenant
    await prisma.tenants.update({
      where: { tenantId },
      data: { signatureUrl: null },
    });

    await invalidateTenantCache(tenantId, tenant.subdomain, tenant.custom_domain);

    res.status(200).json({
      success: true,
      message: "Firma digital eliminada exitosamente",
    });
  } catch (error) {
    logger.error('Error eliminando firma digital', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al eliminar la firma digital",
      error: error.message,
    });
  }
};

/**
 * @route GET /api/tenant/info
 * @desc Obtiene información básica del tenant
 * @access Private
 */
const getTenantInfo = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT

    const tenant = await prisma.tenants.findUnique({
      where: { tenantId },
      select: {
        tenantId: true,
        businessName: true,
        cuit: true,
        subdomain: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        signatureUrl: true,
        plan: true,
        status: true,
        maxAgents: true,
        maxProperties: true,
        features: true,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    // Normalizar hasLanding desde landingPage
    const tenantData = tenant;
    const normalizedFeatures = {
      ...tenantData.features,
      hasLanding: tenantData.features?.landingPage || false
    };

    res.status(200).json({
      success: true,
      data: {
        ...tenantData,
        features: normalizedFeatures
      },
    });
  } catch (error) {
    logger.error('Error obteniendo info del tenant', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al obtener información del tenant",
      error: error.message,
    });
  }
};

/**
 * @route PUT /api/tenant/info
 * @desc Actualiza información del tenant
 * @access Private (SUPER_ADMIN only)
 */
const updateTenantInfo = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const { businessName, email, phone, address, logo } = req.body;

    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    const updated = await prisma.tenants.update({
      where: { tenantId },
      data: {
        businessName: businessName || tenant.businessName,
        email: email || tenant.email,
        phone: phone || tenant.phone,
        address: address || tenant.address,
        logo: logo || tenant.logo,
      },
    });

    await invalidateTenantCache(tenantId, tenant.subdomain, tenant.custom_domain);

    res.status(200).json({
      success: true,
      message: "Información actualizada exitosamente",
      data: updated,
    });
  } catch (error) {
    logger.error('Error actualizando info del tenant', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al actualizar información",
      error: error.message,
    });
  }
};

/**
 * @route POST /api/tenant/check-subdomain
 * @desc Verifica si un subdominio está disponible
 * @access Private
 */
const checkSubdomainAvailability = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { subdomain } = req.body;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "El subdominio es requerido",
      });
    }

    // Validar formato del subdominio
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 50) {
      return res.status(400).json({
        success: false,
        message: "El subdominio debe contener solo letras minúsculas, números y guiones (3-50 caracteres)",
        available: false,
      });
    }

    // Verificar si el subdominio ya existe (excluyendo el tenant actual)
    const existingTenant = await prisma.tenants.findFirst({
      where: { subdomain, tenantId: { not: tenantId } },
    });

    const available = !existingTenant;

    res.status(200).json({
      success: true,
      available,
      message: available 
        ? "Subdominio disponible" 
        : "Este subdominio ya está en uso",
    });
  } catch (error) {
    logger.error('Error verificando disponibilidad de subdominio', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al verificar disponibilidad del subdominio",
      error: error.message,
    });
  }
};

/**
 * @route PUT /api/tenant/subdomain
 * @desc Actualiza el subdominio del tenant (solo si tiene plan con landing)
 * @access Private (SUPER_ADMIN)
 */
const updateSubdomain = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { subdomain } = req.body;

    if (!subdomain) {
      return res.status(400).json({
        success: false,
        message: "El subdominio es requerido",
      });
    }

    // Validar formato del subdominio
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(subdomain) || subdomain.length < 3 || subdomain.length > 50) {
      return res.status(400).json({
        success: false,
        message: "El subdominio debe contener solo letras minúsculas, números y guiones (3-50 caracteres)",
      });
    }

    // Obtener tenant
    const tenant = await prisma.tenants.findUnique({ where: { tenantId } });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    // Verificar si el plan incluye landing
    // Las features se guardan directamente en tenant.features al registrar
    const hasLanding = tenant.features?.landingPage || false;
    
    if (!hasLanding) {
      return res.status(403).json({
        success: false,
        message: "Tu plan actual no incluye subdominio personalizado. Actualiza tu plan para desbloquear esta función.",
      });
    }

    // Verificar si el subdominio ya existe (excluyendo el tenant actual)
    const existingTenant = await prisma.tenants.findFirst({
      where: { subdomain, tenantId: { not: tenantId } },
    });

    if (existingTenant) {
      return res.status(409).json({
        success: false,
        message: "Este subdominio ya está en uso por otra inmobiliaria",
      });
    }

    // Actualizar subdominio
    const oldSubdomain = tenant.subdomain;
    await prisma.tenants.update({ where: { tenantId }, data: { subdomain } });

    await invalidateTenantCache(tenantId, oldSubdomain, tenant.custom_domain);

    res.status(200).json({
      success: true,
      message: "Subdominio actualizado exitosamente",
      data: {
        subdomain,
        url: `${subdomain}.innoinmobiliaria.com`
      },
    });
  } catch (error) {
    logger.error('Error actualizando subdominio', { tenantId, error: error.message });
    res.status(500).json({
      success: false,
      message: "Error al actualizar el subdominio",
      error: error.message,
    });
  }
};

// ─── PaymentMethods ──────────────────────────────────────────────────────────

/**
 * @route GET /api/tenant/payment-methods
 * @desc Lista los métodos de pago configurados por el tenant
 * @access Private
 */
const getPaymentMethods = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const methods = await prisma.PaymentMethods.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    res.status(200).json({ success: true, data: methods });
  } catch (error) {
    logger.error('Error obteniendo métodos de pago', { tenantId: req.user?.tenantId, error: error.message });
    res.status(500).json({ success: false, message: 'Error al obtener métodos de pago' });
  }
};

/**
 * @route POST /api/tenant/payment-methods
 * @desc Crea un método de pago. Para QR: subir imagen con /api/upload primero y pasar la URL como `value`.
 * @body { type: 'cbu'|'alias'|'qr'|'transferencia', label: string, value: string }
 * @access Private (SUPER_ADMIN)
 */
const createPaymentMethod = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { type, label, value } = req.body;

    const VALID_TYPES = ['cbu', 'alias', 'qr', 'transferencia'];
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: `type debe ser uno de: ${VALID_TYPES.join(', ')}` });
    }
    if (!label || !label.trim()) {
      return res.status(400).json({ success: false, message: 'label es requerido' });
    }
    if (!value || !value.trim()) {
      return res.status(400).json({ success: false, message: 'value es requerido' });
    }

    const method = await prisma.PaymentMethods.create({
      data: { tenantId, type, label: label.trim(), value: value.trim() },
    });

    res.status(201).json({ success: true, data: method });
  } catch (error) {
    logger.error('Error creando método de pago', { tenantId: req.user?.tenantId, error: error.message });
    res.status(500).json({ success: false, message: 'Error al crear método de pago' });
  }
};

/**
 * @route PUT /api/tenant/payment-methods/:id
 * @desc Actualiza un método de pago (label, value, isActive)
 * @access Private (SUPER_ADMIN)
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);
    const { label, value, isActive } = req.body;

    const existing = await prisma.PaymentMethods.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Método de pago no encontrado' });
    }

    const updated = await prisma.PaymentMethods.update({
      where: { id },
      data: {
        ...(label !== undefined && { label: label.trim() }),
        ...(value !== undefined && { value: value.trim() }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error actualizando método de pago', { tenantId: req.user?.tenantId, error: error.message });
    res.status(500).json({ success: false, message: 'Error al actualizar método de pago' });
  }
};

/**
 * @route DELETE /api/tenant/payment-methods/:id
 * @desc Elimina un método de pago. Si es QR, borra el blob de Azure.
 * @access Private (SUPER_ADMIN)
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);

    const existing = await prisma.PaymentMethods.findFirst({ where: { id, tenantId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Método de pago no encontrado' });
    }

    // Si es QR, eliminar imagen de Azure Blob
    if (existing.type === 'qr' && existing.value) {
      try {
        await azureBlobHelper.deleteFile(existing.value);
      } catch (err) {
        logger.warn('No se pudo eliminar QR de Azure Blob', { id, error: err.message });
      }
    }

    await prisma.PaymentMethods.delete({ where: { id } });

    res.status(200).json({ success: true, message: 'Método de pago eliminado' });
  } catch (error) {
    logger.error('Error eliminando método de pago', { tenantId: req.user?.tenantId, error: error.message });
    res.status(500).json({ success: false, message: 'Error al eliminar método de pago' });
  }
};

module.exports = {
  uploadSignature,
  getSignature,
  deleteSignature,
  getTenantInfo,
  updateTenantInfo,
  checkSubdomainAvailability,
  updateSubdomain,
  getPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
};
