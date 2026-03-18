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
        // Si es cuota, se requiere calcular o recibir installmentNumber y totalInstallments.
        // Podés calcular el número siguiente si no lo pasás desde el front:
        const lastReceipt = await prisma.PaymentReceipts.findFirst({
          where: { leaseId: parseInt(leaseId), type: 'installment', tenantId },
          orderBy: { installmentNumber: 'desc' },
        });
        finalInstallmentNumber = lastReceipt ? lastReceipt.installmentNumber + 1 : 1;
  
        // Si totalInstallments se envía, se puede usar, o de lo contrario puede venir del contrato.
        if (totalInstallments) {
          finalTotalInstallments = totalInstallments;
        } else {
          // Aquí podrías, por ejemplo, consultar el contrato para definir la cantidad total.
          return res.status(400).json({ error: 'El total de cuotas es requerido para una cuota.' });
        }
      }
  
      const newPaymentReceipt = await prisma.PaymentReceipts.create({
        data: {
          tenantId,
          idClient: parseInt(idClient),
          leaseId: parseInt(leaseId),
          paymentDate: new Date(paymentDate),
          amount,
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
        });

        if (!payments.length) {
            return res.status(404).json({ error: 'No se encontraron pagos para este contrato' });
        }

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