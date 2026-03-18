const prisma = require("../utils/prismaClient");
const cloudinaryHelper = require("../utils/cloudinaryHelper");
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

    // Si ya tiene una firma anterior, eliminarla de Cloudinary
    if (tenant.signatureUrl) {
      try {
        await cloudinaryHelper.deleteImage(tenant.signatureUrl);
      } catch (error) {
        logger.warn('No se pudo eliminar la firma anterior de Cloudinary', { tenantId, error: error.message });
      }
    }

    // Subir nueva firma a Cloudinary
    const result = await cloudinaryHelper.uploadImage(
      signatureDataUrl,
      tenantId,
      "signatures",
      {
        public_id: `signature-tenant-${tenantId}`,
        overwrite: true,
        resource_type: "image",
        format: "png",
      }
    );

    // Actualizar tenant con la nueva URL
    await prisma.tenants.update({
      where: { tenantId },
      data: { signatureUrl: result.secure_url },
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

    // Eliminar de Cloudinary
    try {
      await cloudinaryHelper.deleteImage(tenant.signatureUrl);
    } catch (error) {
      logger.warn('No se pudo eliminar firma de Cloudinary', { tenantId, error: error.message });
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

module.exports = {
  uploadSignature,
  getSignature,
  deleteSignature,
  getTenantInfo,
  updateTenantInfo,
  checkSubdomainAvailability,
  updateSubdomain,
};
