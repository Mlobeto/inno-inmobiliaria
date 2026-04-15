const prisma = require('../utils/prismaClient');

// ─────────────────────────────────────────────
// COMISIONES — gestión y liquidación de comisiones por operaciones
// ─────────────────────────────────────────────

/**
 * GET /commissions
 * Lista comisiones del tenant con filtros opcionales.
 * SUPER_ADMIN: ve todas.
 * AGENT: ve solo las propias.
 */
exports.listCommissions = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;
    const { agentId, status, transactionType, year, month, page = 1, limit = 50 } = req.query;

    const where = { tenantId };

    // Los agentes solo ven sus propias comisiones
    if (role === 'AGENT') {
      where.agentId = adminId;
    } else if (agentId) {
      where.agentId = Number(agentId);
    }

    if (status) where.status = status;
    if (transactionType) where.transactionType = transactionType;

    if (year && month) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      where.createdAt = { gte: start, lt: end };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      where.createdAt = { gte: start, lt: end };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [commissions, total] = await Promise.all([
      prisma.commissions.findMany({
        where,
        include: {
          admins_commissions_agentIdToadmins: {
            select: { adminId: true, username: true, fullName: true, email: true },
          },
          admins_commissions_approvedByToadmins: {
            select: { adminId: true, username: true, fullName: true },
          },
          Property: {
            select: { propertyId: true, address: true, neighborhood: true, city: true, type: true },
          },
          Clients: {
            select: { idClient: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.commissions.count({ where }),
    ]);

    // Totales para el resumen
    const totals = await prisma.commissions.aggregate({
      where,
      _sum: {
        transactionAmount: true,
        inmobiliariaCommissionAmount: true,
        agentCommissionAmount: true,
      },
    });

    return res.status(200).json({
      success: true,
      commissions,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      totals: {
        transactionAmount: Number(totals._sum.transactionAmount || 0),
        inmobiliariaCommissionAmount: Number(totals._sum.inmobiliariaCommissionAmount || 0),
        agentCommissionAmount: Number(totals._sum.agentCommissionAmount || 0),
      },
    });
  } catch (error) {
    console.error('Error en listCommissions:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener comisiones' });
  }
};

/**
 * GET /commissions/settlement
 * Resumen de liquidación por agente para un período.
 * Solo SUPER_ADMIN.
 */
exports.getSettlement = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { year, month } = req.query;

    const where = { tenantId };
    if (year && month) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 1);
      where.createdAt = { gte: start, lt: end };
    } else if (year) {
      const start = new Date(Number(year), 0, 1);
      const end = new Date(Number(year) + 1, 0, 1);
      where.createdAt = { gte: start, lt: end };
    }

    // Obtener todos los agentes del tenant
    const agents = await prisma.admins.findMany({
      where: { tenantId, role: 'AGENT', deletedAt: null },
      select: { adminId: true, username: true, fullName: true, email: true },
    });

    const settlement = await Promise.all(
      agents.map(async (agent) => {
        const stats = await prisma.commissions.aggregate({
          where: { ...where, agentId: agent.adminId },
          _sum: {
            transactionAmount: true,
            inmobiliariaCommissionAmount: true,
            agentCommissionAmount: true,
          },
          _count: { id: true },
        });

        const byStatus = await prisma.commissions.groupBy({
          by: ['status'],
          where: { ...where, agentId: agent.adminId },
          _sum: { agentCommissionAmount: true },
          _count: { id: true },
        });

        return {
          agent,
          operationsCount: stats._count.id,
          totalTransactionAmount: Number(stats._sum.transactionAmount || 0),
          totalInmobiliariaCommission: Number(stats._sum.inmobiliariaCommissionAmount || 0),
          totalAgentCommission: Number(stats._sum.agentCommissionAmount || 0),
          byStatus: byStatus.map((s) => ({
            status: s.status,
            count: s._count.id,
            amount: Number(s._sum.agentCommissionAmount || 0),
          })),
        };
      })
    );

    return res.status(200).json({ success: true, settlement, period: { year, month } });
  } catch (error) {
    console.error('Error en getSettlement:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener liquidación' });
  }
};

/**
 * GET /commissions/:id
 * Detalle de una comisión.
 */
exports.getCommissionById = async (req, res) => {
  try {
    const { tenantId, adminId, role } = req.user;
    const id = Number(req.params.id);

    const where = { id, tenantId };
    if (role === 'AGENT') where.agentId = adminId;

    const commission = await prisma.commissions.findFirst({
      where,
      include: {
        admins_commissions_agentIdToadmins: {
          select: { adminId: true, username: true, fullName: true, email: true },
        },
        admins_commissions_approvedByToadmins: {
          select: { adminId: true, username: true, fullName: true },
        },
        Property: { select: { propertyId: true, address: true, neighborhood: true, city: true, type: true } },
        Clients: { select: { idClient: true, name: true } },
      },
    });

    if (!commission) return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    return res.status(200).json({ success: true, commission });
  } catch (error) {
    console.error('Error en getCommissionById:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener comisión' });
  }
};

/**
 * POST /commissions
 * Crea una comisión manualmente.
 * Solo SUPER_ADMIN.
 */
exports.createCommission = async (req, res) => {
  try {
    const { tenantId, adminId: currentAdminId } = req.user;
    const {
      agentId,
      transactionType,
      transactionId,
      propertyId,
      clientId,
      transactionAmount,
      inmobiliariaCommissionPercent,
      agentCommissionPercent,
      notes,
    } = req.body;

    // Validaciones básicas
    if (!agentId || !transactionType || !propertyId || transactionAmount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'agentId, transactionType, propertyId y transactionAmount son obligatorios',
      });
    }

    const validTypes = ['VENTA', 'ALQUILER', 'ALQUILER_TEMPORAL'];
    if (!validTypes.includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: `transactionType debe ser uno de: ${validTypes.join(', ')}`,
      });
    }

    // Verificar que el agente pertenece al tenant
    const agent = await prisma.admins.findFirst({
      where: { adminId: Number(agentId), tenantId, deletedAt: null },
    });
    if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado en este tenant' });

    // Verificar que la propiedad pertenece al tenant
    const property = await prisma.Property.findFirst({
      where: { propertyId: Number(propertyId), tenantId },
    });
    if (!property) return res.status(404).json({ success: false, message: 'Propiedad no encontrada' });

    // Calcular montos de comisión
    const txAmount = parseFloat(transactionAmount);
    const inmoPercent = inmobiliariaCommissionPercent !== undefined ? parseFloat(inmobiliariaCommissionPercent) : null;
    const agentPercent = agentCommissionPercent !== undefined ? parseFloat(agentCommissionPercent) : null;

    const inmoAmount = inmoPercent !== null ? (txAmount * inmoPercent) / 100 : null;
    const agentAmount = agentPercent !== null ? (txAmount * agentPercent) / 100 : null;

    const commission = await prisma.commissions.create({
      data: {
        tenantId,
        agentId: Number(agentId),
        transactionType,
        transactionId: transactionId ? Number(transactionId) : 0,
        propertyId: Number(propertyId),
        clientId: clientId ? Number(clientId) : null,
        transactionAmount: txAmount,
        inmobiliariaCommissionPercent: inmoPercent,
        inmobiliariaCommissionAmount: inmoAmount,
        agentCommissionPercent: agentPercent,
        agentCommissionAmount: agentAmount,
        status: 'PENDING',
        notes: notes?.trim() || null,
      },
      include: {
        admins_commissions_agentIdToadmins: {
          select: { adminId: true, username: true, fullName: true },
        },
        Property: { select: { propertyId: true, address: true } },
      },
    });

    return res.status(201).json({ success: true, commission });
  } catch (error) {
    console.error('Error en createCommission:', error);
    return res.status(500).json({ success: false, message: 'Error al crear comisión' });
  }
};

/**
 * PUT /commissions/:id
 * Actualiza datos de una comisión (solo si está en PENDING).
 * Solo SUPER_ADMIN.
 */
exports.updateCommission = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = Number(req.params.id);
    const {
      transactionAmount,
      inmobiliariaCommissionPercent,
      agentCommissionPercent,
      notes,
      agentId,
      clientId,
    } = req.body;

    const existing = await prisma.commissions.findFirst({ where: { id, tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    if (existing.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden editar comisiones en estado PENDING',
      });
    }

    const updateData = {};
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (clientId !== undefined) updateData.clientId = clientId ? Number(clientId) : null;
    if (agentId !== undefined) {
      const agent = await prisma.admins.findFirst({ where: { adminId: Number(agentId), tenantId, deletedAt: null } });
      if (!agent) return res.status(404).json({ success: false, message: 'Agente no encontrado' });
      updateData.agentId = Number(agentId);
    }

    // Recalcular montos si cambian los inputs
    const txAmount = transactionAmount !== undefined ? parseFloat(transactionAmount) : Number(existing.transactionAmount);
    const inmoPercent = inmobiliariaCommissionPercent !== undefined
      ? (inmobiliariaCommissionPercent !== null ? parseFloat(inmobiliariaCommissionPercent) : null)
      : existing.inmobiliariaCommissionPercent !== null ? Number(existing.inmobiliariaCommissionPercent) : null;
    const agentPercent = agentCommissionPercent !== undefined
      ? (agentCommissionPercent !== null ? parseFloat(agentCommissionPercent) : null)
      : existing.agentCommissionPercent !== null ? Number(existing.agentCommissionPercent) : null;

    if (transactionAmount !== undefined) updateData.transactionAmount = txAmount;
    if (inmobiliariaCommissionPercent !== undefined) {
      updateData.inmobiliariaCommissionPercent = inmoPercent;
      updateData.inmobiliariaCommissionAmount = inmoPercent !== null ? (txAmount * inmoPercent) / 100 : null;
    }
    if (agentCommissionPercent !== undefined) {
      updateData.agentCommissionPercent = agentPercent;
      updateData.agentCommissionAmount = agentPercent !== null ? (txAmount * agentPercent) / 100 : null;
    }

    const updated = await prisma.commissions.update({
      where: { id },
      data: { ...updateData, updatedAt: new Date() },
      include: {
        admins_commissions_agentIdToadmins: {
          select: { adminId: true, username: true, fullName: true },
        },
        Property: { select: { propertyId: true, address: true } },
      },
    });

    return res.status(200).json({ success: true, commission: updated });
  } catch (error) {
    console.error('Error en updateCommission:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar comisión' });
  }
};

/**
 * POST /commissions/:id/approve
 * Aprueba una comisión (PENDING → APPROVED).
 * Solo SUPER_ADMIN.
 */
exports.approveCommission = async (req, res) => {
  try {
    const { tenantId, adminId } = req.user;
    const id = Number(req.params.id);

    const commission = await prisma.commissions.findFirst({ where: { id, tenantId } });
    if (!commission) return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    if (commission.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Solo se pueden aprobar comisiones en PENDING' });
    }

    const updated = await prisma.commissions.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: adminId, approvedAt: new Date(), updatedAt: new Date() },
      include: {
        admins_commissions_agentIdToadmins: { select: { adminId: true, username: true, fullName: true } },
      },
    });

    return res.status(200).json({ success: true, commission: updated });
  } catch (error) {
    console.error('Error en approveCommission:', error);
    return res.status(500).json({ success: false, message: 'Error al aprobar comisión' });
  }
};

/**
 * POST /commissions/:id/pay
 * Marca una comisión como pagada (APPROVED → PAID).
 * Solo SUPER_ADMIN.
 */
exports.markPaid = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = Number(req.params.id);

    const commission = await prisma.commissions.findFirst({ where: { id, tenantId } });
    if (!commission) return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    if (commission.status !== 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Solo se pueden pagar comisiones aprobadas' });
    }

    const updated = await prisma.commissions.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date(), updatedAt: new Date() },
      include: {
        admins_commissions_agentIdToadmins: { select: { adminId: true, username: true, fullName: true } },
      },
    });

    return res.status(200).json({ success: true, commission: updated });
  } catch (error) {
    console.error('Error en markPaid:', error);
    return res.status(500).json({ success: false, message: 'Error al marcar como pagada' });
  }
};

/**
 * POST /commissions/:id/cancel
 * Cancela una comisión (→ CANCELLED).
 * Solo SUPER_ADMIN.
 */
exports.cancelCommission = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = Number(req.params.id);

    const commission = await prisma.commissions.findFirst({ where: { id, tenantId } });
    if (!commission) return res.status(404).json({ success: false, message: 'Comisión no encontrada' });
    if (commission.status === 'PAID') {
      return res.status(400).json({ success: false, message: 'No se puede cancelar una comisión ya pagada' });
    }

    const updated = await prisma.commissions.update({
      where: { id },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    });

    return res.status(200).json({ success: true, commission: updated });
  } catch (error) {
    console.error('Error en cancelCommission:', error);
    return res.status(500).json({ success: false, message: 'Error al cancelar comisión' });
  }
};
