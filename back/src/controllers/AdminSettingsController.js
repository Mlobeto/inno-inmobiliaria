const { AdminSettings } = require('../data');

// 🆕 Obtener TODA la configuración de la inmobiliaria
exports.getSettings = async (req, res) => {
  try {
    // Por ahora sin tenant_id, en fase 1 se agrega: where: { tenant_id }
    let settings = await AdminSettings.findOne();
    
    // Si no existe, crear con valores por defecto
    if (!settings) {
      settings = await AdminSettings.create({
        company_name: 'Mi Inmobiliaria',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_registration: '',
        company_cuit: '',
      });
    }

    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración', details: error.message });
  }
};

// 🆕 Actualizar configuración de la inmobiliaria
exports.updateSettings = async (req, res) => {
  try {
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_registration,
      company_cuit,
      company_logo_url,
      contract_footer_text,
      additional_config,
    } = req.body;

    let settings = await AdminSettings.findOne();

    if (settings) {
      // Actualizar existente
      await settings.update({
        company_name: company_name || settings.company_name,
        company_address: company_address || settings.company_address,
        company_phone: company_phone || settings.company_phone,
        company_email: company_email || settings.company_email,
        company_registration: company_registration || settings.company_registration,
        company_cuit: company_cuit || settings.company_cuit,
        company_logo_url: company_logo_url || settings.company_logo_url,
        contract_footer_text: contract_footer_text || settings.contract_footer_text,
        additional_config: additional_config || settings.additional_config,
      });
    } else {
      // Crear nuevo
      settings = await AdminSettings.create({
        company_name,
        company_address,
        company_phone,
        company_email,
        company_registration,
        company_cuit,
        company_logo_url,
        contract_footer_text,
        additional_config: additional_config || {},
      });
    }

    res.status(200).json({ 
      message: 'Configuración actualizada exitosamente',
      settings 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración', details: error.message });
  }
};

// Obtener firma actual
exports.getSignature = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();
    
    if (!settings || !settings.signatureUrl) {
      return res.status(200).json({ signatureUrl: null });
    }

    res.status(200).json({ signatureUrl: settings.signatureUrl });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener firma', details: error.message });
  }
};

// Guardar o actualizar firma
exports.saveSignature = async (req, res) => {
  try {
    const { signatureUrl } = req.body;

    if (!signatureUrl) {
      return res.status(400).json({ error: 'La URL de la firma es requerida' });
    }

    // Buscar si ya existe configuración
    let settings = await AdminSettings.findOne();

    if (settings) {
      // Actualizar
      settings.signatureUrl = signatureUrl;
      await settings.save();
    } else {
      // Crear nueva
      settings = await AdminSettings.create({ signatureUrl });
    }

    res.status(200).json({ 
      message: 'Firma guardada exitosamente',
      signatureUrl: settings.signatureUrl 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar firma', details: error.message });
  }
};

// Eliminar firma
exports.deleteSignature = async (req, res) => {
  try {
    const settings = await AdminSettings.findOne();

    if (!settings) {
      return res.status(404).json({ error: 'No hay firma para eliminar' });
    }

    settings.signatureUrl = null;
    await settings.save();

    res.status(200).json({ message: 'Firma eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar firma', details: error.message });
  }
};
