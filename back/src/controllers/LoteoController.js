const prisma = require('../utils/prismaClient');

// ─────────────────────────────────────────────
// LOTEOS — CRUD del loteo completo
// ─────────────────────────────────────────────

exports.getLoteos = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const loteos = await prisma.loteos.findMany({
      where: { tenantId },
      include: {
        lotes: { orderBy: { number: 'asc' } },
        _count: { select: { lotes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ success: true, loteos });
  } catch (error) {
    console.error('Error en getLoteos:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener loteos' });
  }
};

exports.getLoteoById = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;
    const loteo = await prisma.loteos.findFirst({
      where: { id: Number(loteoId), tenantId },
      include: { lotes: { orderBy: { number: 'asc' } } },
    });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });
    return res.status(200).json({ success: true, loteo });
  } catch (error) {
    console.error('Error en getLoteoById:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener loteo' });
  }
};

exports.createLoteo = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { name, description, address, city, province, photos, isPublished } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del loteo es obligatorio' });
    }

    const loteo = await prisma.loteos.create({
      data: {
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        province: province?.trim() || null,
        photos: photos || [],
        isPublished: isPublished ?? false,
      },
      include: { lotes: true },
    });

    return res.status(201).json({ success: true, loteo });
  } catch (error) {
    console.error('Error en createLoteo:', error);
    return res.status(500).json({ success: false, message: 'Error al crear loteo' });
  }
};

exports.updateLoteo = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;
    const { name, description, address, city, province, photos, status, isPublished } = req.body;

    const exists = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!exists) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const loteo = await prisma.loteos.update({
      where: { id: Number(loteoId) },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(province !== undefined && { province: province?.trim() || null }),
        ...(photos !== undefined && { photos }),
        ...(status && { status }),
        ...(isPublished !== undefined && { isPublished }),
      },
      include: { lotes: { orderBy: { number: 'asc' } } },
    });

    return res.status(200).json({ success: true, loteo });
  } catch (error) {
    console.error('Error en updateLoteo:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar loteo' });
  }
};

exports.deleteLoteo = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;

    const exists = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!exists) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    await prisma.loteos.delete({ where: { id: Number(loteoId) } });
    return res.status(200).json({ success: true, message: 'Loteo eliminado' });
  } catch (error) {
    console.error('Error en deleteLoteo:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar loteo' });
  }
};

exports.togglePublishLoteo = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;
    const { isPublished } = req.body;

    const exists = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!exists) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const loteo = await prisma.loteos.update({
      where: { id: Number(loteoId) },
      data: { isPublished: Boolean(isPublished) },
    });

    return res.status(200).json({ success: true, loteo });
  } catch (error) {
    console.error('Error en togglePublishLoteo:', error);
    return res.status(500).json({ success: false, message: 'Error al publicar/despublicar loteo' });
  }
};

// ─────────────────────────────────────────────
// LOTES — CRUD de lotes individuales
// ─────────────────────────────────────────────

exports.createLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;
    const { number, surface, price, currency, status, description, photos } = req.body;

    if (!number?.toString().trim()) {
      return res.status(400).json({ success: false, message: 'El número de lote es obligatorio' });
    }

    // Verificar que el loteo pertenece al tenant
    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const lote = await prisma.lotes.create({
      data: {
        loteoId: Number(loteoId),
        number: number.toString().trim(),
        surface: surface ? Number(surface) : null,
        price: price ? Number(price) : null,
        currency: currency || 'USD',
        status: status || 'DISPONIBLE',
        description: description?.trim() || null,
        photos: photos || [],
      },
    });

    // Actualizar contador de lotes en el loteo
    await prisma.loteos.update({
      where: { id: Number(loteoId) },
      data: { totalLotes: { increment: 1 } },
    });

    return res.status(201).json({ success: true, lote });
  } catch (error) {
    console.error('Error en createLote:', error);
    return res.status(500).json({ success: false, message: 'Error al crear lote' });
  }
};

exports.updateLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId } = req.params;
    const { number, surface, price, currency, status, description, photos } = req.body;

    // Verificar que el loteo pertenece al tenant
    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const lote = await prisma.lotes.update({
      where: { id: Number(loteId) },
      data: {
        ...(number !== undefined && { number: number.toString().trim() }),
        ...(surface !== undefined && { surface: surface ? Number(surface) : null }),
        ...(price !== undefined && { price: price ? Number(price) : null }),
        ...(currency && { currency }),
        ...(status && { status }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(photos !== undefined && { photos }),
      },
    });

    return res.status(200).json({ success: true, lote });
  } catch (error) {
    console.error('Error en updateLote:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar lote' });
  }
};

exports.deleteLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId } = req.params;

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    await prisma.lotes.delete({ where: { id: Number(loteId) } });

    await prisma.loteos.update({
      where: { id: Number(loteoId) },
      data: { totalLotes: { decrement: 1 } },
    });

    return res.status(200).json({ success: true, message: 'Lote eliminado' });
  } catch (error) {
    console.error('Error en deleteLote:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar lote' });
  }
};
