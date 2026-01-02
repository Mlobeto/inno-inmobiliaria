const { Tenant } = require("../data");
const cloudinaryHelper = require("../utils/cloudinaryHelper");

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
    const tenant = await Tenant.findByPk(tenantId);
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
        console.warn("No se pudo eliminar la firma anterior:", error.message);
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
    await tenant.update({
      signatureUrl: result.secure_url,
    });

    res.status(200).json({
      success: true,
      message: "Firma digital actualizada exitosamente",
      data: {
        signatureUrl: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Error subiendo firma:", error);
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

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ["signatureUrl"],
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
    console.error("Error obteniendo firma:", error);
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

    const tenant = await Tenant.findByPk(tenantId);
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
      console.warn("No se pudo eliminar de Cloudinary:", error.message);
    }

    // Actualizar tenant
    await tenant.update({
      signatureUrl: null,
    });

    res.status(200).json({
      success: true,
      message: "Firma digital eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error eliminando firma:", error);
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

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: [
        "tenantId",
        "businessName",
        "cuit",
        "subdomain",
        "email",
        "phone",
        "address",
        "logo",
        "signatureUrl",
        "plan",
        "status",
        "maxAgents",
        "maxProperties",
        "features",
      ],
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Error obteniendo info del tenant:", error);
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

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant no encontrado",
      });
    }

    await tenant.update({
      businessName: businessName || tenant.businessName,
      email: email || tenant.email,
      phone: phone || tenant.phone,
      address: address || tenant.address,
      logo: logo || tenant.logo,
    });

    res.status(200).json({
      success: true,
      message: "Información actualizada exitosamente",
      data: tenant,
    });
  } catch (error) {
    console.error("Error actualizando tenant:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar información",
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
};
