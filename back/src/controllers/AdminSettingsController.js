const { AdminSettings } = require('../data');

// 🆕 Obtener TODA la configuración de la inmobiliaria
exports.getSettings = async (req, res) => {
  try {
    console.log('🔍 getSettings - req.user:', req.user);
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    console.log('🔍 getSettings - tenantId:', tenantId);
    
    let settings = await AdminSettings.findOne({ where: { tenantId } });
    console.log('🔍 getSettings - settings found:', settings ? 'Yes' : 'No');
    
    // Si no existe, crear con valores por defecto
    if (!settings) {
      console.log('🔍 getSettings - Creating new settings...');
      settings = await AdminSettings.create({
        tenantId,
        company_name: 'Mi Inmobiliaria',
        company_address: '',
        company_city: '',
        company_province: '',
        company_phone: '',
        company_email: '',
        company_registration: '',
        company_cuit: '',
      });
      console.log('🔍 getSettings - New settings created:', settings.id);
    }

    res.status(200).json(settings);
  } catch (error) {
    console.error('❌ getSettings error:', error);
    res.status(500).json({ error: 'Error al obtener configuración', details: error.message });
  }
};

// 🆕 Actualizar configuración de la inmobiliaria
exports.updateSettings = async (req, res) => {
  try {
    const {
      company_name,
      company_address,
      company_city,
      company_province,
      company_phone,
      company_email,
      company_registration,
      company_cuit,
      company_ingresos_brutos,
      company_condicion_iva,
      company_inicio_actividad,
      professional_title,
      company_logo_url,
      receipt_prefix,
      receipt_footer_text,
      contract_footer_text,
      whatsapp_template,
      requisitos_template,
      additional_config,
    } = req.body;

    const { tenantId } = req.user; // Obtener tenantId del token JWT
    let settings = await AdminSettings.findOne({ where: { tenantId } });

    if (settings) {
      // Actualizar existente
      await settings.update({
        company_name: company_name || settings.company_name,
        company_address: company_address || settings.company_address,
        company_city: company_city || settings.company_city,
        company_province: company_province || settings.company_province,
        company_phone: company_phone || settings.company_phone,
        company_email: company_email || settings.company_email,
        company_registration: company_registration || settings.company_registration,
        company_cuit: company_cuit || settings.company_cuit,
        company_ingresos_brutos: company_ingresos_brutos || settings.company_ingresos_brutos,
        company_condicion_iva: company_condicion_iva || settings.company_condicion_iva,
        company_inicio_actividad: company_inicio_actividad || settings.company_inicio_actividad,
        professional_title: professional_title || settings.professional_title,
        company_logo_url: company_logo_url || settings.company_logo_url,
        receipt_prefix: receipt_prefix || settings.receipt_prefix,
        receipt_footer_text: receipt_footer_text !== undefined ? receipt_footer_text : settings.receipt_footer_text,
        contract_footer_text: contract_footer_text || settings.contract_footer_text,
        whatsapp_template: whatsapp_template !== undefined ? whatsapp_template : settings.whatsapp_template,
        requisitos_template: requisitos_template !== undefined ? requisitos_template : settings.requisitos_template,
        additional_config: additional_config || settings.additional_config,
      });
    } else {
      // Crear nuevo
      settings = await AdminSettings.create({
        tenantId,
        company_name,
        company_address,
        company_city,
        company_province,
        company_phone,
        company_email,
        company_registration,
        company_cuit,
        company_ingresos_brutos,
        company_condicion_iva,
        company_inicio_actividad,
        professional_title,
        company_logo_url,
        receipt_prefix,
        receipt_footer_text,
        contract_footer_text,
        whatsapp_template,
        requisitos_template,
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
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const settings = await AdminSettings.findOne({ where: { tenantId } });
    
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
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    let settings = await AdminSettings.findOne({ where: { tenantId } });

    if (settings) {
      // Actualizar
      settings.signatureUrl = signatureUrl;
      await settings.save();
    } else {
      // Crear nueva
      settings = await AdminSettings.create({ tenantId, signatureUrl });
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
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    const settings = await AdminSettings.findOne({ where: { tenantId } });

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
