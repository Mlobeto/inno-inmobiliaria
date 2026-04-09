const prisma = require('../utils/prismaClient');
const { logAudit } = require('../utils/audit');

exports.createPayment = async (req, res) => {
    try {
      const { tenantId } = req.user; // Obtener tenantId del token JWT (una sola vez)
      const {
        idClient,
        leaseId,
        paymentDate,
        amount,
        period,
        type, // "installment", "commission" o "initial"
        installmentNumber, // opcional para "installment"
        totalInstallments, // opcional para "installment"
        originalAmount,    // monto en moneda original (si se pagó en USD)
        originalCurrency,  // 'ARS' o 'USD'
        dolarRateUsed,     // cotización usada para la conversión
      } = req.body;
  
      // Validación previa básica
      if (!idClient || !leaseId || !paymentDate || !amount || !type) {
        return res.status(400).json({ error: 'Faltan datos obligatorios.' });
      }

      // Validar que period exista para installment y commission
      if ((type === 'installment' || type === 'commission') && !period) {
        return res.status(400).json({ error: 'El período es requerido para cuotas y comisiones.' });
      }

      // Generar período automáticamente para pagos iniciales si no se proporciona
      let finalPeriod = period;
      if (type === 'initial' && !period) {
        const fecha = new Date(paymentDate);
        const mes = fecha.toLocaleDateString('es-AR', { month: 'long' });
        const año = fecha.getFullYear();
        finalPeriod = `Pago Inicial - ${mes} ${año}`;
      }
  
      // Validar que solo exista un pago inicial por contrato
      if (type === "initial") {
      const existingInitial = await prisma.PaymentReceipts.findFirst({
        where: { leaseId: parseInt(leaseId), type: 'initial', tenantId },
      });
        if (existingInitial) {
          return res.status(400).json({ 
            error: 'Ya existe un pago inicial para este contrato. Solo se permite un pago inicial por contrato.' 
          });
        }
      }
  
      let finalInstallmentNumber = null;
      let finalTotalInstallments = null;
  
      if (type === "installment") {
        if (!totalInstallments) {
          return res.status(400).json({ error: 'El total de cuotas es requerido para una cuota.' });
        }
        finalTotalInstallments = parseInt(totalInstallments);

        // Usar el installmentNumber enviado por el frontend (elegido en InstallmentSelector)
        if (installmentNumber) {
          finalInstallmentNumber = parseInt(installmentNumber);

          // Evitar pagar la misma cuota dos veces
          const existingDuplicate = await prisma.PaymentReceipts.findFirst({
            where: {
              leaseId: parseInt(leaseId),
              type: 'installment',
              installmentNumber: finalInstallmentNumber,
              tenantId,
            },
          });
          if (existingDuplicate) {
            return res.status(400).json({
              error: `La cuota ${finalInstallmentNumber} de este contrato ya fue registrada.`,
            });
          }
        } else {
          // Fallback: calcular el siguiente número si no se envía
          const lastReceipt = await prisma.PaymentReceipts.findFirst({
            where: { leaseId: parseInt(leaseId), type: 'installment', tenantId },
            orderBy: { installmentNumber: 'desc' },
          });
          finalInstallmentNumber = lastReceipt ? lastReceipt.installmentNumber + 1 : 1;
        }
      }
  
      const newPaymentReceipt = await prisma.PaymentReceipts.create({
        data: {
          tenantId,
          idClient: parseInt(idClient),
          leaseId: parseInt(leaseId),
          paymentDate: new Date(paymentDate),
          amount,                                                            // siempre ARS
          originalAmount: originalAmount ?? null,                            // monto en moneda original
          originalCurrency: ['ARS', 'USD'].includes(originalCurrency) ? originalCurrency : 'ARS',
          dolarRateUsed: dolarRateUsed ?? null,                              // cotización al momento del cobro
          period: finalPeriod,
          type,
          installmentNumber: type === "installment" ? finalInstallmentNumber : null,
          totalInstallments: type === "installment" ? finalTotalInstallments : null,
        },
      });
  
      res.status(201).json(newPaymentReceipt);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: 'Error al crear el pago',
        details: error.message,
      });
    }
  };

    
exports.getPaymentsByIdClient = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        const { idClient } = req.params;

        const payments = await prisma.PaymentReceipts.findMany({
            where: { idClient: parseInt(idClient), tenantId },
            include: { Clients: true },
        });

        if (!payments.length) {
            return res.status(404).json({ error: 'No se encontraron pagos para este cliente' });
        }

        // Enrich with lease + property data
        const leaseIds = [...new Set(payments.map(p => p.leaseId).filter(Boolean))];
        const leases = leaseIds.length
            ? await prisma.Leases.findMany({ where: { id: { in: leaseIds } }, include: { Property: true } })
            : [];
        const leaseMap = Object.fromEntries(leases.map(l => [l.id, l]));
        const enriched = payments.map(p => ({ ...p, Lease: leaseMap[p.leaseId] || null }));
        res.status(200).json(enriched);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los pagos', details: error.message });
    }
};
exports.getPaymentsByLeaseId = async (req, res) => {
    try {
        const { tenantId } = req.user; // Obtener tenantId del token JWT
        const { leaseId } = req.params;

        const payments = await prisma.PaymentReceipts.findMany({
            where: { leaseId: parseInt(leaseId), tenantId },
            include: { Clients: true },
            orderBy: { installmentNumber: 'asc' },
        });

        // Devolver array vacío si no hay pagos (no 404)
        res.status(200).json(payments);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los pagos', details: error.message });
    }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { tenantId } = req.user; // Obtener tenantId del token JWT
    
    const payments = await prisma.PaymentReceipts.findMany({
      where: { tenantId },
      include: { Clients: true },
    });

    // Enrich with lease + property data
    const leaseIds = [...new Set(payments.map(p => p.leaseId).filter(Boolean))];
    const leases = leaseIds.length
      ? await prisma.Leases.findMany({ where: { id: { in: leaseIds } }, include: { Property: true } })
      : [];
    const leaseMap = Object.fromEntries(leases.map(l => [l.id, l]));
    const enriched = payments.map(p => ({ ...p, Lease: leaseMap[p.leaseId] || null }));

    // ✅ Devolver array vacío si no hay pagos, no un error 404
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pagos', details: error.message });
  }
};

exports.getPaymentsByLease = async (req, res) => {
  try {
    const { leaseId } = req.params;

    const lease = await prisma.Leases.findUnique({ where: { id: parseInt(leaseId) } });
    if (!lease) {
      return res.status(404).json({ error: 'Contrato no encontrado.' });
    }

    const paymentReceipts = await prisma.PaymentReceipts.findMany({
      where: { leaseId: parseInt(leaseId) },
      select: { id: true, amount: true, paymentDate: true, period: true },
    });

    res.status(200).json({
      message: 'Pagos encontrados.',
      payments: paymentReceipts.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        period: payment.period,
      })),
    });
  } catch (error) {
    console.error('Error al obtener pagos del contrato:', error);
    res.status(500).json({
      error: 'Error al obtener pagos del contrato.',
      details: error.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;
    const { paymentDate, amount, period, type, installmentNumber, totalInstallments } = req.body;

    const existing = await prisma.PaymentReceipts.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    const updated = await prisma.PaymentReceipts.update({
      where: { id: parseInt(id) },
      data: {
        ...(paymentDate && { paymentDate: new Date(paymentDate) }),
        ...(amount !== undefined && { amount: parseFloat(amount) }),
        ...(period && { period }),
        ...(type && { type }),
        ...(installmentNumber !== undefined && { installmentNumber: installmentNumber ? parseInt(installmentNumber) : null }),
        ...(totalInstallments !== undefined && { totalInstallments: totalInstallments ? parseInt(totalInstallments) : null }),
      },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    res.status(500).json({ error: 'Error al actualizar el pago.', details: error.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { id } = req.params;

    const existing = await prisma.PaymentReceipts.findFirst({
      where: { id: parseInt(id), tenantId },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    await prisma.PaymentReceipts.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Pago eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar el pago:', error);
    res.status(500).json({ error: 'Error al eliminar el pago.', details: error.message });
  }
};

// ─── Gestión de comprobantes del portal (admin) ───────────────────────────────

/**
 * PUT /api/payment/:id/aprobar-comprobante
 * Admin aprueba el comprobante subido por el inquilino:
 * voucherStatus = approved, status = paid, paidAt = now
 */
exports.aprobarComprobante = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);

    const receipt = await prisma.PaymentReceipts.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!receipt) return res.status(404).json({ error: 'Pago no encontrado.' });
    if (!receipt.voucherUrl) return res.status(400).json({ error: 'No hay comprobante para aprobar.' });
    if (receipt.voucherStatus === 'approved') return res.status(400).json({ error: 'Ya está aprobado.' });

    const updated = await prisma.PaymentReceipts.update({
      where: { id },
      data: {
        voucherStatus: 'approved',
        status: 'paid',
        paidAt: new Date(),
        voucherRejReason: null,
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error al aprobar comprobante:', error);
    res.status(500).json({ error: 'Error interno.', details: error.message });
  }
};

/**
 * PUT /api/payment/:id/rechazar-comprobante
 * Body: { reason } — motivo de rechazo
 * Admin rechaza el comprobante: voucherStatus = rejected, voucherRejReason = reason
 */
exports.rechazarComprobante = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const id = parseInt(req.params.id, 10);
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'El motivo de rechazo es requerido.' });
    }

    const receipt = await prisma.PaymentReceipts.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!receipt) return res.status(404).json({ error: 'Pago no encontrado.' });
    if (!receipt.voucherUrl) return res.status(400).json({ error: 'No hay comprobante para rechazar.' });

    const updated = await prisma.PaymentReceipts.update({
      where: { id },
      data: {
        voucherStatus: 'rejected',
        voucherRejReason: reason.trim(),
      },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Error al rechazar comprobante:', error);
    res.status(500).json({ error: 'Error interno.', details: error.message });
  }
};
