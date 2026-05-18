'use strict';
const prisma = require('../utils/prismaClient');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Incluye los agentes asignados en cada lead */
const LEAD_INCLUDE = {
  agents: {
    include: {
      admin: {
        select: { adminId: true, fullName: true, username: true, email: true },
      },
    },
  },
};

/** Normaliza un lead para que el frontend reciba `assignedAgents: [{adminId, fullName, ...}]` */
const normalize = (lead) => ({
  ...lead,
  assignedAgents: (lead.agents || []).map((la) => la.admin),
  agents: undefined,
});

// ─── GET /leads ───────────────────────────────────────────────────────────────
exports.getAllLeads = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;

    const where = { tenantId };

    // Los agentes solo ven los leads que tienen asignados
    if (role === 'AGENT') {
      where.agents = { some: { agentId: adminId } };
    }

    const leads = await prisma.leads.findMany({
      where,
      include: LEAD_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, leads: leads.map(normalize) });
  } catch (error) {
    console.error('Error en getAllLeads:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener leads' });
  }
};

// ─── GET /leads/:id ───────────────────────────────────────────────────────────
exports.getLeadById = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;
    const { id } = req.params;

    const lead = await prisma.leads.findFirst({
      where: { id: Number(id), tenantId },
      include: LEAD_INCLUDE,
    });

    if (!lead) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    // Agente solo puede ver leads en los que está asignado
    if (role === 'AGENT' && !lead.agents.some((la) => la.agentId === adminId)) {
      return res.status(403).json({ success: false, message: 'Sin acceso a este lead' });
    }

    return res.status(200).json({ success: true, lead: normalize(lead) });
  } catch (error) {
    console.error('Error en getLeadById:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener lead' });
  }
};

// ─── POST /leads ──────────────────────────────────────────────────────────────
// agentIds (array opcional): agentes a asignar. Si es AGENT, se ignora y se asigna a sí mismo.
exports.createLead = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;
    const { name, phone, email, operationType, budget, currency, zone, notes, status, agentIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es obligatorio' });
    }

    // Si el creador es AGENT, siempre se asigna a sí mismo (ignora agentIds)
    const finalAgentIds = role === 'AGENT'
      ? [adminId]
      : Array.isArray(agentIds) ? agentIds.map(Number).filter(Boolean) : [];

    const lead = await prisma.leads.create({
      data: {
        tenantId,
        name:          name.trim(),
        phone:         phone       || null,
        email:         email       ? email.trim().toLowerCase() : null,
        operationType: operationType || null,
        budget:        budget !== undefined && budget !== '' ? Number(budget) : null,
        currency:      currency    || 'ARS',
        zone:          zone        || null,
        notes:         notes       || null,
        status:        status      || 'NUEVO',
        agents: finalAgentIds.length
          ? { create: finalAgentIds.map((agentId) => ({ agentId })) }
          : undefined,
      },
      include: LEAD_INCLUDE,
    });

    return res.status(201).json({ success: true, lead: normalize(lead) });
  } catch (error) {
    console.error('Error en createLead:', error);
    return res.status(500).json({ success: false, message: 'Error al crear lead' });
  }
};

// ─── PUT /leads/:id ───────────────────────────────────────────────────────────
// agentIds (array opcional): reemplaza la lista completa de agentes asignados.
exports.updateLead = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;
    const { id } = req.params;
    const { name, phone, email, operationType, budget, currency, zone, notes, status, agentIds } = req.body;

    const existing = await prisma.leads.findFirst({
      where: { id: Number(id), tenantId },
      include: { agents: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    // Agente solo puede editar leads donde está asignado
    if (role === 'AGENT' && !existing.agents.some((la) => la.agentId === adminId)) {
      return res.status(403).json({ success: false, message: 'Sin acceso a este lead' });
    }

    // Agentes no pueden reasignar agentes
    const canManageAgents = role !== 'AGENT' && Array.isArray(agentIds);

    const lead = await prisma.leads.update({
      where: { id: Number(id) },
      data: {
        ...(name          !== undefined && { name: name.trim() }),
        ...(phone         !== undefined && { phone: phone || null }),
        ...(email         !== undefined && { email: email ? email.trim().toLowerCase() : null }),
        ...(operationType !== undefined && { operationType: operationType || null }),
        ...(budget        !== undefined && { budget: budget !== '' ? Number(budget) : null }),
        ...(currency      !== undefined && { currency }),
        ...(zone          !== undefined && { zone: zone || null }),
        ...(notes         !== undefined && { notes: notes || null }),
        ...(status        !== undefined && { status }),
        ...(canManageAgents && {
          agents: {
            deleteMany: {},                                         // borra todos los actuales
            create: agentIds.map(Number).filter(Boolean).map((agentId) => ({ agentId })),
          },
        }),
      },
      include: LEAD_INCLUDE,
    });

    return res.status(200).json({ success: true, lead: normalize(lead) });
  } catch (error) {
    console.error('Error en updateLead:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar lead' });
  }
};

// ─── POST /leads/:id/assign ───────────────────────────────────────────────────
// Agrega un agente a un lead SIN borrar los existentes (solo SUPER_ADMIN).
exports.assignAgent = async (req, res) => {
  try {
    const { tenantId, role } = req.user;
    if (role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo el administrador puede asignar agentes' });
    }
    const { id } = req.params;
    const { agentId } = req.body;

    if (!agentId) return res.status(400).json({ success: false, message: 'agentId es obligatorio' });

    const lead = await prisma.leads.findFirst({ where: { id: Number(id), tenantId } });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    const agent = await prisma.admins.findFirst({
      where: { adminId: Number(agentId), tenantId, deletedAt: null },
    });
    if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado' });

    await prisma.lead_agents.upsert({
      where:  { leadId_agentId: { leadId: Number(id), agentId: Number(agentId) } },
      create: { leadId: Number(id), agentId: Number(agentId) },
      update: {},
    });

    const updated = await prisma.leads.findFirst({
      where: { id: Number(id) },
      include: LEAD_INCLUDE,
    });

    return res.status(200).json({ success: true, lead: normalize(updated) });
  } catch (error) {
    console.error('Error en assignAgent:', error);
    return res.status(500).json({ success: false, message: 'Error al asignar agente' });
  }
};

// ─── DELETE /leads/:id/assign/:agentId ────────────────────────────────────────
// Quita un agente de un lead (solo SUPER_ADMIN).
exports.unassignAgent = async (req, res) => {
  try {
    const { tenantId, role } = req.user;
    if (role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo el administrador puede quitar asignaciones' });
    }
    const { id, agentId } = req.params;

    const lead = await prisma.leads.findFirst({ where: { id: Number(id), tenantId } });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    await prisma.lead_agents.deleteMany({
      where: { leadId: Number(id), agentId: Number(agentId) },
    });

    const updated = await prisma.leads.findFirst({
      where: { id: Number(id) },
      include: LEAD_INCLUDE,
    });

    return res.status(200).json({ success: true, lead: normalize(updated) });
  } catch (error) {
    console.error('Error en unassignAgent:', error);
    return res.status(500).json({ success: false, message: 'Error al desasignar agente' });
  }
};

// ─── DELETE /leads/:id ────────────────────────────────────────────────────────
exports.deleteLead = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;
    const { id } = req.params;

    const existing = await prisma.leads.findFirst({
      where: { id: Number(id), tenantId },
      include: { agents: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Lead no encontrado' });

    // Agente no puede eliminar leads
    if (role === 'AGENT') {
      return res.status(403).json({ success: false, message: 'Los agentes no pueden eliminar leads' });
    }

    await prisma.leads.delete({ where: { id: Number(id) } });
    return res.status(200).json({ success: true, message: 'Lead eliminado' });
  } catch (error) {
    console.error('Error en deleteLead:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar lead' });
  }
};
