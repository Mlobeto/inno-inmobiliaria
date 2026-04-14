const prisma = require('../utils/prismaClient');

exports.getAllLeads = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const leads = await prisma.leads.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, leads });
  } catch (error) {
    console.error('Error en getAllLeads:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener leads' });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const lead = await prisma.leads.findFirst({
      where: { id: Number(id), tenantId },
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead no encontrado' });
    return res.status(200).json({ success: true, lead });
  } catch (error) {
    console.error('Error en getLeadById:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener lead' });
  }
};

exports.createLead = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name, phone, email, operationType, budget, currency, zone, notes, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }

    const lead = await prisma.leads.create({
      data: {
        tenantId,
        name: name.trim(),
        phone: phone || null,
        email: email ? email.trim().toLowerCase() : null,
        operationType: operationType || null,
        budget: budget !== undefined && budget !== '' ? Number(budget) : null,
        currency: currency || 'ARS',
        zone: zone || null,
        notes: notes || null,
        status: status || 'NUEVO',
      },
    });

    return res.status(201).json({ success: true, lead });
  } catch (error) {
    console.error('Error en createLead:', error);
    return res.status(500).json({ success: false, message: 'Error al crear lead' });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { name, phone, email, operationType, budget, currency, zone, notes, status } = req.body;

    const existing = await prisma.leads.findFirst({ where: { id: Number(id), tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    const lead = await prisma.leads.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(operationType !== undefined && { operationType: operationType || null }),
        ...(budget !== undefined && { budget: budget !== '' ? Number(budget) : null }),
        ...(currency !== undefined && { currency }),
        ...(zone !== undefined && { zone: zone || null }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(status !== undefined && { status }),
      },
    });

    return res.status(200).json({ success: true, lead });
  } catch (error) {
    console.error('Error en updateLead:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar lead' });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const existing = await prisma.leads.findFirst({ where: { id: Number(id), tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    await prisma.leads.delete({ where: { id: Number(id) } });
    return res.status(200).json({ success: true, message: 'Lead eliminado' });
  } catch (error) {
    console.error('Error en deleteLead:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar lead' });
  }
};
