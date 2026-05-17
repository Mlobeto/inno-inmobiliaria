const prisma = require('../utils/prismaClient');

// ─────────────────────────────────────────────────────────────────────────────
// GET /clause-library  — list system + tenant clauses
// ─────────────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { category, contractType } = req.query;

    const where = {
      OR: [{ tenantId }, { tenantId: null }],
      isActive: true,
    };
    if (category) where.category = category;
    if (contractType) where.contractTypes = { has: contractType };

    const clauses = await prisma.ContractClauses.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return res.json({ success: true, clauses });
  } catch (err) {
    console.error('ClauseController.list:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener cláusulas' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /clause-library  — create custom clause
// ─────────────────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { title, content, category = 'general', contractTypes = ['CONTRATO_ALQUILER'], sortOrder = 0 } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Título y contenido son requeridos' });
    }

    const clause = await prisma.ContractClauses.create({
      data: { tenantId, title, content, category, contractTypes, isSystem: false, sortOrder },
    });

    return res.status(201).json({ success: true, clause });
  } catch (err) {
    console.error('ClauseController.create:', err);
    return res.status(500).json({ success: false, message: 'Error al crear cláusula' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /clause-library/:id  — update (only tenant's own)
// ─────────────────────────────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { title, content, category, contractTypes, sortOrder, isActive } = req.body;

    const existing = await prisma.ContractClauses.findFirst({
      where: { id: parseInt(id), tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Cláusula no encontrada o no editable' });
    }

    const clause = await prisma.ContractClauses.update({
      where: { id: parseInt(id) },
      data: {
        ...(title        !== undefined && { title }),
        ...(content      !== undefined && { content }),
        ...(category     !== undefined && { category }),
        ...(contractTypes !== undefined && { contractTypes }),
        ...(sortOrder    !== undefined && { sortOrder }),
        ...(isActive     !== undefined && { isActive }),
      },
    });

    return res.json({ success: true, clause });
  } catch (err) {
    console.error('ClauseController.update:', err);
    return res.status(500).json({ success: false, message: 'Error al actualizar cláusula' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /clause-library/:id  — soft-delete (only tenant's own)
// ─────────────────────────────────────────────────────────────────────────────
exports.remove = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const existing = await prisma.ContractClauses.findFirst({
      where: { id: parseInt(id), tenantId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Cláusula no encontrada o no eliminable' });
    }

    await prisma.ContractClauses.update({
      where: { id: parseInt(id) },
      data: { isActive: false },
    });

    return res.json({ success: true, message: 'Cláusula eliminada' });
  } catch (err) {
    console.error('ClauseController.remove:', err);
    return res.status(500).json({ success: false, message: 'Error al eliminar cláusula' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /clause-library/:id/duplicate  — clone system clause as editable copy
// ─────────────────────────────────────────────────────────────────────────────
exports.duplicate = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const source = await prisma.ContractClauses.findFirst({
      where: {
        id: parseInt(id),
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!source) {
      return res.status(404).json({ success: false, message: 'Cláusula no encontrada' });
    }

    const copy = await prisma.ContractClauses.create({
      data: {
        tenantId,
        title:         `${source.title} (copia)`,
        content:       source.content,
        category:      source.category,
        contractTypes: source.contractTypes,
        isSystem:      false,
        sortOrder:     source.sortOrder,
      },
    });

    return res.status(201).json({ success: true, clause: copy });
  } catch (err) {
    console.error('ClauseController.duplicate:', err);
    return res.status(500).json({ success: false, message: 'Error al duplicar cláusula' });
  }
};
