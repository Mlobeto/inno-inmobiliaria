const bcrypt = require('bcrypt');
const prisma = require('../utils/prismaClient');

// ─────────────────────────────────────────────
// AGENTES — gestión de usuarios dentro del tenant
// Solo el SUPER_ADMIN puede gestionar agentes.
// Un agente es un admin con role='AGENT' y mismo tenantId.
// ─────────────────────────────────────────────

/**
 * GET /agents
 * Lista todos los agentes del tenant (excluye al SUPER_ADMIN actual).
 */
exports.listAgents = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;

    // El agente autenticado solo ve sus propios datos (para selects / perfil)
    if (role === 'AGENT') {
      const agent = await prisma.admins.findFirst({
        where: { adminId, tenantId, role: 'AGENT', deletedAt: null },
        select: {
          adminId: true,
          username: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { commissions_commissions_agentIdToadmins: true },
          },
        },
      });
      if (!agent) {
        return res.status(200).json({ success: true, agents: [] });
      }
      const commissionStats = await prisma.commissions.aggregate({
        where: { tenantId, agentId: adminId },
        _sum: { agentCommissionAmount: true },
        _count: { id: true },
      });
      const pendingCount = await prisma.commissions.count({
        where: { tenantId, agentId: adminId, status: 'PENDING' },
      });
      return res.status(200).json({
        success: true,
        agents: [{
          ...agent,
          totalCommissions: Number(commissionStats._sum.agentCommissionAmount || 0),
          commissionsCount: commissionStats._count.id,
          pendingCommissions: pendingCount,
        }],
      });
    }

    if (role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Sin permiso para listar el equipo completo',
      });
    }

    const agents = await prisma.admins.findMany({
      where: {
        tenantId,
        role: 'AGENT',
        deletedAt: null,
      },
      select: {
        adminId: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { commissions_commissions_agentIdToadmins: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calcular totales de comisiones por agente
    const agentsWithStats = await Promise.all(
      agents.map(async (agent) => {
        const commissionStats = await prisma.commissions.aggregate({
          where: { tenantId, agentId: agent.adminId },
          _sum: { agentCommissionAmount: true },
          _count: { id: true },
        });
        const pendingCount = await prisma.commissions.count({
          where: { tenantId, agentId: agent.adminId, status: 'PENDING' },
        });
        return {
          ...agent,
          totalCommissions: Number(commissionStats._sum.agentCommissionAmount || 0),
          commissionsCount: commissionStats._count.id,
          pendingCommissions: pendingCount,
        };
      })
    );

    return res.status(200).json({ success: true, agents: agentsWithStats });
  } catch (error) {
    console.error('Error en listAgents:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener agentes' });
  }
};

/**
 * GET /agents/:agentId
 * Detalle de un agente con sus comisiones recientes.
 */
exports.getAgentById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const agentId = Number(req.params.agentId);

    const agent = await prisma.admins.findFirst({
      where: { adminId: agentId, tenantId, role: 'AGENT', deletedAt: null },
      select: {
        adminId: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado' });

    const commissions = await prisma.commissions.findMany({
      where: { tenantId, agentId },
      include: {
        Property: { select: { address: true, neighborhood: true, city: true } },
        Clients: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.status(200).json({ success: true, agent, commissions });
  } catch (error) {
    console.error('Error en getAgentById:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener agente' });
  }
};

/**
 * POST /agents
 * Crea un nuevo agente para el tenant.
 * Verifica que no se supere el límite maxUsers del plan.
 */
exports.createAgent = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { username, password, fullName, email } = req.body;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ success: false, message: 'Usuario y contraseña son obligatorios' });
    }

    // Verificar límite de usuarios del plan
    const maxUsers = req.plan?.features?.maxUsers;
    if (maxUsers !== undefined && maxUsers !== null) {
      const currentCount = await prisma.admins.count({
        where: { tenantId, deletedAt: null },
      });
      if (currentCount >= maxUsers) {
        return res.status(403).json({
          success: false,
          message: `Tu plan permite un máximo de ${maxUsers} usuarios. Ya tienes ${currentCount}.`,
          code: 'USER_LIMIT_REACHED',
          limit: maxUsers,
          current: currentCount,
        });
      }
    }

    // Verificar si el username ya existe (global, no sólo por tenant)
    const existing = await prisma.admins.findUnique({
      where: { username: username.trim() },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'El nombre de usuario ya está en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const agent = await prisma.admins.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        fullName: fullName?.trim() || null,
        email: email?.trim() || null,
        role: 'AGENT',
        tenantId,
      },
      select: {
        adminId: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, agent });
  } catch (error) {
    console.error('Error en createAgent:', error);
    return res.status(500).json({ success: false, message: 'Error al crear agente' });
  }
};

/**
 * PUT /agents/:agentId
 * Actualiza datos de un agente. Si se manda password, la cambia.
 */
exports.updateAgent = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const agentId = Number(req.params.agentId);
    const { fullName, email, password } = req.body;

    const agent = await prisma.admins.findFirst({
      where: { adminId: agentId, tenantId, role: 'AGENT', deletedAt: null },
    });
    if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado' });

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (password?.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.admins.update({
      where: { adminId: agentId },
      data: { ...updateData, updatedAt: new Date() },
      select: {
        adminId: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ success: true, agent: updated });
  } catch (error) {
    console.error('Error en updateAgent:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar agente' });
  }
};

/**
 * DELETE /agents/:agentId
 * Desactiva (soft delete) un agente del tenant.
 */
exports.deactivateAgent = async (req, res) => {
  try {
    const { tenantId, adminId: currentAdminId } = req.user;
    const agentId = Number(req.params.agentId);

    if (agentId === currentAdminId) {
      return res.status(400).json({ success: false, message: 'No podés desactivarte a vos mismo' });
    }

    const agent = await prisma.admins.findFirst({
      where: { adminId: agentId, tenantId, role: 'AGENT', deletedAt: null },
    });
    if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado' });

    await prisma.admins.update({
      where: { adminId: agentId },
      data: { deletedAt: new Date() },
    });

    return res.status(200).json({ success: true, message: 'Agente desactivado correctamente' });
  } catch (error) {
    console.error('Error en deactivateAgent:', error);
    return res.status(500).json({ success: false, message: 'Error al desactivar agente' });
  }
};

/**
 * POST /agents/:agentId/reactivate
 * Reactiva un agente previamente desactivado.
 */
exports.reactivateAgent = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const agentId = Number(req.params.agentId);

    const agent = await prisma.admins.findFirst({
      where: { adminId: agentId, tenantId, role: 'AGENT' },
    });
    if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado' });
    if (!agent.deletedAt) return res.status(400).json({ success: false, message: 'El agente ya está activo' });

    // Verificar límite antes de reactivar
    const maxUsers = req.plan?.features?.maxUsers;
    if (maxUsers !== undefined && maxUsers !== null) {
      const currentCount = await prisma.admins.count({
        where: { tenantId, deletedAt: null },
      });
      if (currentCount >= maxUsers) {
        return res.status(403).json({
          success: false,
          message: `Tu plan permite un máximo de ${maxUsers} usuarios. Actualizá tu plan para reactivar agentes.`,
          code: 'USER_LIMIT_REACHED',
        });
      }
    }

    await prisma.admins.update({
      where: { adminId: agentId },
      data: { deletedAt: null },
    });

    return res.status(200).json({ success: true, message: 'Agente reactivado correctamente' });
  } catch (error) {
    console.error('Error en reactivateAgent:', error);
    return res.status(500).json({ success: false, message: 'Error al reactivar agente' });
  }
};
