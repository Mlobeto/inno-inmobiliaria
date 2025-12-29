const { AdminSettings } = require('../data');

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
