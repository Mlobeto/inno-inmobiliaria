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
    const { name, description, address, city, province, photos, isPublished, precioBase, totalLotes } = req.body;

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
        precioBase: precioBase ? Number(precioBase) : null,
        totalLotes: totalLotes ? Number(totalLotes) : 0,
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
    const { name, description, address, city, province, photos, status, isPublished, precioBase, totalLotes } = req.body;

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
        ...(precioBase !== undefined && { precioBase: precioBase ? Number(precioBase) : null }),
        ...(totalLotes !== undefined && { totalLotes: totalLotes ? Number(totalLotes) : 0 }),
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

// ─────────────────────────────────────────────
// VENTA Y PLAN DE FINANCIACIÓN DE UN LOTE
// ─────────────────────────────────────────────

exports.getVentaLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId } = req.params;

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const venta = await prisma.lote_ventas.findUnique({
      where: { loteId: Number(loteId) },
      include: { cuotas: { orderBy: { numeroCuota: 'asc' } } },
    });

    return res.status(200).json({ success: true, venta });
  } catch (error) {
    console.error('Error en getVentaLote:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener la venta' });
  }
};

exports.createVentaLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId } = req.params;
    const {
      clienteNombre, clienteCuil, clienteTelefono,
      fechaVenta, precioTotal, currency,
      anticipo, cantidadCuotas, interes, periodicidad, notas,
    } = req.body;

    if (!clienteNombre?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es obligatorio' });
    }
    if (!precioTotal || precioTotal <= 0) {
      return res.status(400).json({ success: false, message: 'El precio total es obligatorio' });
    }
    if (!cantidadCuotas || cantidadCuotas <= 0) {
      return res.status(400).json({ success: false, message: 'La cantidad de cuotas es obligatoria' });
    }

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const lote = await prisma.lotes.findFirst({ where: { id: Number(loteId), loteoId: Number(loteoId) } });
    if (!lote) return res.status(404).json({ success: false, message: 'Lote no encontrado' });

    // Verificar que no tenga venta ya
    const existing = await prisma.lote_ventas.findUnique({ where: { loteId: Number(loteId) } });
    if (existing) return res.status(409).json({ success: false, message: 'Este lote ya tiene un plan de venta registrado' });

    const saldo = Number(precioTotal) - Number(anticipo || 0);
    const interesDecimal = interes ? Number(interes) / 100 : 0;
    // Cálculo con interés simple sobre saldo
    const montoConInteres = interesDecimal > 0 ? saldo * (1 + interesDecimal) : saldo;
    const montoCuota = Math.ceil(montoConInteres / Number(cantidadCuotas));

    // Generar cuotas
    const fechaBase = fechaVenta ? new Date(fechaVenta) : new Date();
    const MESES_POR_PERIODO = { MENSUAL: 1, BIMESTRAL: 2, TRIMESTRAL: 3, SEMESTRAL: 6, ANUAL: 12 };
    const mesesPeriodo = MESES_POR_PERIODO[periodicidad] || 1;

    const cuotasData = Array.from({ length: Number(cantidadCuotas) }, (_, i) => {
      const fecha = new Date(fechaBase);
      fecha.setMonth(fecha.getMonth() + (i + 1) * mesesPeriodo);
      return {
        numeroCuota: i + 1,
        fechaVencimiento: fecha,
        monto: montoCuota,
        pagado: false,
      };
    });

    const venta = await prisma.lote_ventas.create({
      data: {
        loteId: Number(loteId),
        tenantId,
        clienteNombre: clienteNombre.trim(),
        clienteCuil: clienteCuil?.trim() || null,
        clienteTelefono: clienteTelefono?.trim() || null,
        fechaVenta: fechaBase,
        precioTotal: Number(precioTotal),
        currency: currency || 'ARS',
        anticipo: Number(anticipo || 0),
        saldo,
        cantidadCuotas: Number(cantidadCuotas),
        montoCuota,
        interes: interes ? Number(interes) : null,
        periodicidad: periodicidad || 'MENSUAL',
        notas: notas?.trim() || null,
        cuotas: { create: cuotasData },
      },
      include: { cuotas: { orderBy: { numeroCuota: 'asc' } } },
    });

    // Marcar lote como vendido
    await prisma.lotes.update({
      where: { id: Number(loteId) },
      data: { status: 'VENDIDO', price: Number(precioTotal), currency: currency || 'ARS' },
    });

    return res.status(201).json({ success: true, venta });
  } catch (error) {
    console.error('Error en createVentaLote:', error);
    return res.status(500).json({ success: false, message: 'Error al crear la venta' });
  }
};

exports.updateVentaLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId } = req.params;
    const { clienteNombre, clienteCuil, clienteTelefono, notas } = req.body;

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const venta = await prisma.lote_ventas.findUnique({ where: { loteId: Number(loteId) } });
    if (!venta) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

    const updated = await prisma.lote_ventas.update({
      where: { id: venta.id },
      data: {
        ...(clienteNombre && { clienteNombre: clienteNombre.trim() }),
        ...(clienteCuil !== undefined && { clienteCuil: clienteCuil?.trim() || null }),
        ...(clienteTelefono !== undefined && { clienteTelefono: clienteTelefono?.trim() || null }),
        ...(notas !== undefined && { notas: notas?.trim() || null }),
        updatedAt: new Date(),
      },
      include: { cuotas: { orderBy: { numeroCuota: 'asc' } } },
    });

    return res.status(200).json({ success: true, venta: updated });
  } catch (error) {
    console.error('Error en updateVentaLote:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar la venta' });
  }
};

exports.pagarCuota = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId, cuotaId } = req.params;
    const { pagado, fechaPago, notas } = req.body;

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const cuota = await prisma.lote_cuotas.update({
      where: { id: Number(cuotaId) },
      data: {
        pagado: Boolean(pagado),
        fechaPago: pagado ? (fechaPago ? new Date(fechaPago) : new Date()) : null,
        ...(notas !== undefined && { notas: notas?.trim() || null }),
      },
    });

    return res.status(200).json({ success: true, cuota });
  } catch (error) {
    console.error('Error en pagarCuota:', error);
    return res.status(500).json({ success: false, message: 'Error al registrar el pago' });
  }
};

exports.deleteVentaLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId } = req.params;

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const venta = await prisma.lote_ventas.findUnique({ where: { loteId: Number(loteId) } });
    if (!venta) return res.status(404).json({ success: false, message: 'Venta no encontrada' });

    await prisma.lote_ventas.delete({ where: { id: venta.id } });

    // Volver el lote a disponible
    await prisma.lotes.update({
      where: { id: Number(loteId) },
      data: { status: 'DISPONIBLE' },
    });

    return res.status(200).json({ success: true, message: 'Venta eliminada' });
  } catch (error) {
    console.error('Error en deleteVentaLote:', error);
    return res.status(500).json({ success: false, message: 'Error al eliminar la venta' });
  }
};
