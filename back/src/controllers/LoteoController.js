const prisma = require('../utils/prismaClient');
const {
  buildPeriodicCuotas,
  buildCustomCuotas,
  calcFinancingTotals,
} = require('../../../shared/src/utils/loteCuotasSchedule');

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
    const { name, description, address, city, province, photos, isPublished, precioBase, totalLotes, planImageUrl } = req.body;

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
        planImageUrl: planImageUrl?.trim() || null,
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
    const { name, description, address, city, province, photos, status, isPublished, precioBase, totalLotes, planImageUrl } = req.body;

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
        ...(planImageUrl !== undefined && { planImageUrl: planImageUrl?.trim() || null }),
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

/** Guardar plano interactivo: imagen + posiciones de lotes (planX/planY en 0–1) */
exports.saveLoteoPlan = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;
    const { planImageUrl, positions } = req.body;

    const loteo = await prisma.loteos.findFirst({
      where: { id: Number(loteoId), tenantId },
      include: { lotes: { select: { id: true } } },
    });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const validLoteIds = new Set(loteo.lotes.map((l) => l.id));

    await prisma.$transaction(async (tx) => {
      if (planImageUrl !== undefined) {
        await tx.loteos.update({
          where: { id: Number(loteoId) },
          data: { planImageUrl: planImageUrl?.trim() || null },
        });
      }

      if (Array.isArray(positions)) {
        for (const pos of positions) {
          const id = Number(pos.loteId);
          if (!validLoteIds.has(id)) continue;

          const hasCoords = pos.planX != null && pos.planY != null
            && !Number.isNaN(Number(pos.planX))
            && !Number.isNaN(Number(pos.planY));

          await tx.lotes.update({
            where: { id },
            data: hasCoords
              ? {
                  planX: Math.min(1, Math.max(0, Number(pos.planX))),
                  planY: Math.min(1, Math.max(0, Number(pos.planY))),
                }
              : { planX: null, planY: null },
          });
        }
      }
    });

    const updated = await prisma.loteos.findFirst({
      where: { id: Number(loteoId), tenantId },
      include: { lotes: { orderBy: { number: 'asc' } } },
    });

    return res.status(200).json({ success: true, loteo: updated });
  } catch (error) {
    console.error('Error en saveLoteoPlan:', error);
    return res.status(500).json({ success: false, message: 'Error al guardar el plano' });
  }
};

// ─────────────────────────────────────────────
// LOTES — CRUD de lotes individuales
// ─────────────────────────────────────────────

exports.createLote = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId } = req.params;
    const { number, parcela, surface, price, currency, status, description, photos, planX, planY } = req.body;

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
        parcela: parcela?.trim() || null,
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
    const { number, parcela, surface, price, currency, status, description, photos, planX, planY } = req.body;

    // Verificar que el loteo pertenece al tenant
    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const lote = await prisma.lotes.update({
      where: { id: Number(loteId) },
      data: {
        ...(number !== undefined && { number: number.toString().trim() }),
        ...(parcela !== undefined && { parcela: parcela?.trim() || null }),
        ...(surface !== undefined && { surface: surface ? Number(surface) : null }),
        ...(price !== undefined && { price: price ? Number(price) : null }),
        ...(currency && { currency }),
        ...(status && { status }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(photos !== undefined && { photos }),
        ...(planX !== undefined && {
          planX: planX != null ? Math.min(1, Math.max(0, Number(planX))) : null,
        }),
        ...(planY !== undefined && {
          planY: planY != null ? Math.min(1, Math.max(0, Number(planY))) : null,
        }),
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
      comisionPercent,
      modoPlan, diaVencimiento, cuotasCustom,
    } = req.body;

    if (!clienteNombre?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre del cliente es obligatorio' });
    }
    if (!precioTotal || precioTotal <= 0) {
      return res.status(400).json({ success: false, message: 'El precio total es obligatorio' });
    }

    const planMode = (modoPlan === 'PERSONALIZADO' || periodicidad === 'PERSONALIZADO')
      ? 'PERSONALIZADO'
      : 'PERIODICO';
    const isCustom = planMode === 'PERSONALIZADO';

    if (!isCustom && (!cantidadCuotas || cantidadCuotas <= 0)) {
      return res.status(400).json({ success: false, message: 'La cantidad de cuotas es obligatoria' });
    }
    if (isCustom && (!Array.isArray(cuotasCustom) || cuotasCustom.length === 0)) {
      return res.status(400).json({ success: false, message: 'Definí al menos una cuota con fecha de vencimiento' });
    }

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const lote = await prisma.lotes.findFirst({ where: { id: Number(loteId), loteoId: Number(loteoId) } });
    if (!lote) return res.status(404).json({ success: false, message: 'Lote no encontrado' });

    // Verificar que no tenga venta ya
    const existing = await prisma.lote_ventas.findUnique({ where: { loteId: Number(loteId) } });
    if (existing) return res.status(409).json({ success: false, message: 'Este lote ya tiene un plan de venta registrado' });

    const saldo = Number(precioTotal) - Number(anticipo || 0);
    const cuotasCount = isCustom ? cuotasCustom.length : Number(cantidadCuotas);
    const { montoConInteres, montoCuota } = calcFinancingTotals(
      precioTotal,
      anticipo,
      interes,
      cuotasCount,
    );

    // Comisión inmobiliaria sobre precio total
    const comisionPct = comisionPercent ? Number(comisionPercent) : null;
    const comisionMonto = comisionPct ? Math.round((Number(precioTotal) * comisionPct) / 100) : null;

    const fechaBase = fechaVenta ? new Date(fechaVenta) : new Date();
    fechaBase.setHours(12, 0, 0, 0);
    const diaVenc = Math.min(31, Math.max(1, Number(diaVencimiento) || 10));

    let cuotasData;
    if (isCustom) {
      for (const row of cuotasCustom) {
        if (!row.fechaVencimiento) {
          return res.status(400).json({ success: false, message: 'Cada cuota debe tener fecha de vencimiento' });
        }
      }
      cuotasData = buildCustomCuotas({
        cuotasCustom,
        montoConInteres,
        anticipo: Number(anticipo || 0),
        fechaBase,
      });
      if (cuotasData.length === 0) {
        return res.status(400).json({ success: false, message: 'No se pudieron generar las cuotas' });
      }
    } else {
      cuotasData = buildPeriodicCuotas({
        fechaBase,
        cantidadCuotas: cuotasCount,
        periodicidad: periodicidad || 'MENSUAL',
        diaVencimiento: diaVenc,
        montoCuota,
        anticipo: Number(anticipo || 0),
      });
    }

    const resolvedPeriodicidad = isCustom ? 'PERSONALIZADO' : (periodicidad || 'MENSUAL');

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
        cantidadCuotas: cuotasCount,
        montoCuota,
        interes: interes ? Number(interes) : null,
        periodicidad: resolvedPeriodicidad,
        diaVencimiento: isCustom ? null : diaVenc,
        modoPlan: planMode,
        notas: notas?.trim() || null,
        comisionPercent: comisionPct,
        comisionMonto,
        cuotas: { create: cuotasData },
      },
      include: { cuotas: { orderBy: { numeroCuota: 'asc' } } },
    });

    // Marcar lote como vendido
    await prisma.lotes.update({
      where: { id: Number(loteId) },
      data: { status: 'VENDIDO', price: Number(precioTotal), currency: currency || 'ARS' },
    });

    // Si hay comisión, registrar en tabla de comisiones
    if (comisionPct && comisionMonto) {
      try {
        await prisma.commissions.create({
          data: {
            tenantId,
            agentId: req.user.adminId,
            transactionType: 'VENTA_LOTE',
            transactionId: venta.id,
            propertyId: null,
            loteVentaId: venta.id,
            loteoNombre: `${loteo.name} — Lote #${lote.number}${lote.parcela ? ` (${lote.parcela})` : ''}`,
            transactionAmount: Number(precioTotal),
            inmobiliariaCommissionPercent: comisionPct,
            inmobiliariaCommissionAmount: comisionMonto,
            agentCommissionPercent: null,
            agentCommissionAmount: null,
            status: 'PENDING',
            notes: `Venta de lote a ${clienteNombre.trim()}${notas ? ` — ${notas.trim()}` : ''}`,
          },
        });
      } catch (commErr) {
        // No fallar la venta si falla el registro de comisión
        console.error('Error al registrar comisión de venta de lote:', commErr);
      }
    }

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

// ─────────────────────────────────────────────
// COBRANZAS — todas las cuotas del tenant
// ─────────────────────────────────────────────

exports.getCobranzasLoteos = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { filter = 'pendiente', loteoId, search } = req.query;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const ventaWhere = {
      tenantId,
      ...(loteoId && { lote: { loteoId: Number(loteoId) } }),
      ...(search?.trim() && {
        OR: [
          { clienteNombre: { contains: search.trim(), mode: 'insensitive' } },
          { clienteCuil: { contains: search.trim(), mode: 'insensitive' } },
        ],
      }),
    };

    const cuotaWhere = { venta: ventaWhere };
    if (filter === 'pagada') {
      cuotaWhere.pagado = true;
    } else if (filter === 'vencida') {
      cuotaWhere.pagado = false;
      cuotaWhere.fechaVencimiento = { lt: now };
    } else if (filter === 'pendiente') {
      cuotaWhere.pagado = false;
      cuotaWhere.fechaVencimiento = { gte: now };
    }

    const [cuotas, allUnpaid, pagadasMes, ventasActivas] = await Promise.all([
      prisma.lote_cuotas.findMany({
        where: cuotaWhere,
        include: {
          venta: {
            include: {
              lote: {
                select: {
                  id: true,
                  number: true,
                  parcela: true,
                  loteo: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: [{ pagado: 'asc' }, { fechaVencimiento: 'asc' }],
        take: 300,
      }),
      prisma.lote_cuotas.findMany({
        where: { pagado: false, venta: { tenantId } },
        select: { monto: true, fechaVencimiento: true },
      }),
      prisma.lote_cuotas.count({
        where: {
          pagado: true,
          fechaPago: { gte: startOfMonth },
          venta: { tenantId },
        },
      }),
      prisma.lote_ventas.count({ where: { tenantId } }),
    ]);

    const vencidas = allUnpaid.filter((c) => new Date(c.fechaVencimiento) < now);
    const pendientes = allUnpaid.filter((c) => new Date(c.fechaVencimiento) >= now);

    const items = cuotas.map((c) => {
      const venc = new Date(c.fechaVencimiento);
      let estado = 'pendiente';
      if (c.pagado) estado = 'pagada';
      else if (venc < now) estado = 'vencida';

      return {
        cuotaId: c.id,
        numeroCuota: c.numeroCuota,
        fechaVencimiento: c.fechaVencimiento,
        fechaPago: c.fechaPago,
        monto: c.monto,
        pagado: c.pagado,
        notas: c.notas,
        ventaId: c.venta.id,
        loteoId: c.venta.lote.loteo.id,
        loteoNombre: c.venta.lote.loteo.name,
        loteId: c.venta.lote.id,
        loteNumber: c.venta.lote.number,
        loteParcela: c.venta.lote.parcela,
        clienteNombre: c.venta.clienteNombre,
        clienteTelefono: c.venta.clienteTelefono,
        currency: c.venta.currency,
        cantidadCuotas: c.venta.cantidadCuotas,
        estado,
      };
    });

    return res.status(200).json({
      success: true,
      stats: {
        ventasActivas,
        vencidasCount: vencidas.length,
        vencidasMonto: vencidas.reduce((s, c) => s + c.monto, 0),
        pendientesCount: pendientes.length,
        pendientesMonto: pendientes.reduce((s, c) => s + c.monto, 0),
        pagadasMes,
      },
      cuotas: items,
    });
  } catch (error) {
    console.error('Error en getCobranzasLoteos:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener cobranzas' });
  }
};

exports.pagarCuota = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { loteoId, loteId, cuotaId } = req.params;
    const { pagado, fechaPago, notas } = req.body;

    const loteo = await prisma.loteos.findFirst({ where: { id: Number(loteoId), tenantId } });
    if (!loteo) return res.status(404).json({ success: false, message: 'Loteo no encontrado' });

    const existing = await prisma.lote_cuotas.findFirst({
      where: {
        id: Number(cuotaId),
        venta: {
          tenantId,
          loteId: Number(loteId),
          lote: { loteoId: Number(loteoId) },
        },
      },
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Cuota no encontrada' });
    }

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
