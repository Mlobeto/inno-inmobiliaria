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