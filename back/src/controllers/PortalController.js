const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const azureBlobHelper = require('../utils/azureBlobHelper');
const logger = require('../utils/logger');
const pushNotifications = require('../utils/pushNotifications');
const { buildLeaseInstallmentSchedule } = require('../utils/leaseInstallments');

// ─── Lookup tenant por código/subdomain ──────────────────────────────────────

/**
 * GET /api/portal/tenant?code=admin21
 * Resuelve el subdomain al tenantId y nombre de la inmobiliaria.
 * Público — no requiere autenticación.
 */
exports.lookupTenant = async (req, res) => {
  try {
    const code = (req.query.code || '').toLowerCase().trim();
    if (!code) {
      return res.status(400).json({ message: 'El código de inmobiliaria es requerido' });
    }

    const tenant = await prisma.tenants.findFirst({
      where: { subdomain: code, deletedAt: null },
      select: { tenantId: true, businessName: true, logo: true, subdomain: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: 'No se encontró una inmobiliaria con ese código' });
    }

    return res.json({
      tenantId: tenant.tenantId,
      businessName: tenant.businessName,
      logo: tenant.logo,
      subdomain: tenant.subdomain,
    });
  } catch (err) {
    logger.error('PortalController.lookupTenant error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/portal/auth
 * Body: { email, cuil, tenantId? }
 */
exports.login = async (req, res) => {
  try {
    const { email, cuil } = req.body;

    if (!email || !cuil) {
      return res.status(400).json({ message: 'email y cuil son requeridos' });
    }

    const tenantId = req.body.tenantId
      ? parseInt(req.body.tenantId, 10)
      : req.tenantId || null;

    if (!tenantId) {
      return res.status(400).json({ message: 'No se pudo identificar la inmobiliaria' });
    }

    const client = await prisma.Clients.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        tenantId,
        deletedAt: null,
      },
      select: { idClient: true, cuil: true, name: true, email: true },
    });

    if (!client) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const normalize = (v) => (v || '').replace(/\D/g, '');
    if (normalize(client.cuil) !== normalize(cuil)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const activeLease = await prisma.Leases.findFirst({
      where: {
        tenantId,
        renterId: client.idClient,
        status: { notIn: ['terminated', 'cancelled', 'canceled', 'finalizado', 'FINALIZADO'] },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!activeLease) {
      return res.status(403).json({
        message:
          'No tenés un contrato de alquiler vigente con esta inmobiliaria. Contactá a la administración.',
      });
    }

    const token = jwt.sign(
      { idClient: client.idClient, tenantId, role: 'INQUILINO' },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      client: { idClient: client.idClient, name: client.name, email: client.email },
    });
  } catch (error) {
    logger.error('Portal login error', { error: error.message });
    res.status(500).json({ message: 'Error interno' });
  }
};

async function loadPortalPagosData(idClient, tenantId) {
  const [leases, paymentMethods] = await Promise.all([
    prisma.Leases.findMany({
      where: {
        tenantId,
        renterId: idClient,
        deletedAt: null,
        status: { notIn: ['terminated', 'cancelled', 'canceled', 'finalizado', 'FINALIZADO'] },
      },
      include: {
        Property: { select: { address: true, city: true } },
      },
      orderBy: { startDate: 'desc' },
    }),
    prisma.PaymentMethods.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, type: true, label: true, value: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const leaseIds = leases.map((l) => l.id);
  const receipts =
    leaseIds.length > 0
      ? await prisma.PaymentReceipts.findMany({
          where: {
            tenantId,
            leaseId: { in: leaseIds },
            type: 'installment',
            deletedAt: null,
          },
        })
      : [];

  const receiptsByLease = new Map();
  for (const r of receipts) {
    if (!receiptsByLease.has(r.leaseId)) receiptsByLease.set(r.leaseId, []);
    receiptsByLease.get(r.leaseId).push(r);
  }

  const contracts = leases.map((lease) => {
    const leaseReceipts = receiptsByLease.get(lease.id) || [];
    const installments = buildLeaseInstallmentSchedule(lease, leaseReceipts);
    return {
      leaseId: lease.id,
      propertyAddress: lease.Property?.address || '',
      propertyCity: lease.Property?.city || '',
      rentAmount: lease.rentAmount,
      startDate: lease.startDate,
      totalMonths: lease.totalMonths,
      installments,
    };
  });

  const allInstallments = contracts.flatMap((c) =>
    c.installments.map((inst) => ({
      ...inst,
      propertyAddress: c.propertyAddress,
    }))
  );

  return {
    contracts,
    installments: allInstallments,
    pending: allInstallments.filter((i) => !i.isPaid),
    paid: allInstallments.filter((i) => i.isPaid),
    paymentMethods,
  };
}

// ─── Mis pagos ─────────────────────────────────────────────────────────────────

/**
 * GET /api/portal/mis-pagos
 * Calendario de cuotas del contrato + métodos de pago del tenant.
 */
exports.getMisPagos = async (req, res) => {
  try {
    const { idClient, tenantId } = req.portalClient;
    const data = await loadPortalPagosData(idClient, tenantId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    logger.error('Portal getMisPagos error', { error: error.message });
    res.status(500).json({ message: 'Error interno' });
  }
};

async function notifyComprobante(tenantId, idClient, receipt) {
  try {
    const client = await prisma.Clients.findUnique({
      where: { idClient },
      select: { name: true },
    });
    const clientName = client?.name ?? 'Un inquilino';
    await pushNotifications.sendToTenant(
      tenantId,
      '📄 Nuevo comprobante recibido',
      `${clientName} informó pago de ${receipt.period || 'una cuota'}`,
      { receiptId: receipt.id, type: 'comprobante' }
    );
  } catch (_) {
    /* no bloquear */
  }
}

/**
 * POST /api/portal/informar-pago
 * Multipart: file, leaseId, installmentNumber, paymentMethodId
 * Crea/actualiza el recibo de cuota pendiente y sube comprobante.
 */
exports.informarPago = async (req, res) => {
  try {
    const { idClient, tenantId } = req.portalClient;
    const leaseId = parseInt(req.body.leaseId, 10);
    const installmentNumber = parseInt(req.body.installmentNumber, 10);
    const paymentMethodId = parseInt(req.body.paymentMethodId, 10);
    const filePath = req.file?.path;

    if (!req.file) {
      return res.status(400).json({ message: 'Subí una foto o PDF del comprobante' });
    }
    if (!leaseId || !installmentNumber || !paymentMethodId) {
      return res.status(400).json({
        message: 'leaseId, installmentNumber y paymentMethodId son requeridos',
      });
    }

    const lease = await prisma.Leases.findFirst({
      where: {
        id: leaseId,
        tenantId,
        renterId: idClient,
        deletedAt: null,
      },
    });
    if (!lease) {
      return res.status(404).json({ message: 'Contrato no encontrado' });
    }

    const method = await prisma.PaymentMethods.findFirst({
      where: { id: paymentMethodId, tenantId, isActive: true },
    });
    if (!method) {
      return res.status(400).json({ message: 'Método de pago no válido' });
    }

    const existingReceipts = await prisma.PaymentReceipts.findMany({
      where: { leaseId, tenantId, type: 'installment', deletedAt: null },
    });
    const schedule = buildLeaseInstallmentSchedule(lease, existingReceipts);
    const slot = schedule.find((s) => s.installmentNumber === installmentNumber);
    if (!slot) {
      return res.status(400).json({ message: 'Cuota no válida para este contrato' });
    }
    if (slot.isPaid) {
      return res.status(400).json({ message: 'Esta cuota ya está registrada como pagada' });
    }

    let receipt = existingReceipts.find((r) => r.installmentNumber === installmentNumber);

    if (receipt?.voucherUrl) {
      try {
        await azureBlobHelper.deleteFile(receipt.voucherUrl);
      } catch (err) {
        logger.warn('No se pudo eliminar comprobante anterior', { error: err.message });
      }
    }

    const uploadResult = await azureBlobHelper.uploadFile(filePath, tenantId, 'receipts', {
      originalName: req.file.originalname,
    });

    if (receipt) {
      receipt = await prisma.PaymentReceipts.update({
        where: { id: receipt.id },
        data: {
          voucherUrl: uploadResult.url,
          voucherStatus: 'pending_review',
          voucherRejReason: null,
          paymentMethodId,
          status: 'pending',
        },
      });
    } else {
      receipt = await prisma.PaymentReceipts.create({
        data: {
          tenantId,
          idClient,
          leaseId,
          paymentDate: new Date(slot.paymentDate),
          amount: lease.rentAmount,
          originalCurrency: 'ARS',
          period: slot.period,
          type: 'installment',
          status: 'pending',
          installmentNumber,
          totalInstallments: lease.totalMonths,
          voucherUrl: uploadResult.url,
          voucherStatus: 'pending_review',
          paymentMethodId,
        },
      });
    }

    await notifyComprobante(tenantId, idClient, receipt);

    res.status(200).json({
      success: true,
      data: {
        receiptId: receipt.id,
        voucherUrl: receipt.voucherUrl,
        voucherStatus: receipt.voucherStatus,
        paymentMethodId: receipt.paymentMethodId,
      },
    });
  } catch (error) {
    logger.error('Portal informarPago error', { error: error.message });
    res.status(500).json({ message: 'Error interno' });
  }
};

/**
 * POST /api/portal/pago/:id/comprobante
 * Reenvío de comprobante sobre recibo existente (compat mobile).
 */
exports.subirComprobante = async (req, res) => {
  try {
    const { idClient, tenantId } = req.portalClient;
    const receiptId = parseInt(req.params.id, 10);
    const paymentMethodId = req.body.paymentMethodId
      ? parseInt(req.body.paymentMethodId, 10)
      : null;

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const receipt = await prisma.PaymentReceipts.findFirst({
      where: { id: receiptId, idClient, tenantId, deletedAt: null },
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Cuota no encontrada' });
    }
    if (receipt.status === 'paid' || receipt.voucherStatus === 'approved') {
      return res.status(400).json({ message: 'Esta cuota ya fue aprobada' });
    }

    if (paymentMethodId) {
      const method = await prisma.PaymentMethods.findFirst({
        where: { id: paymentMethodId, tenantId, isActive: true },
      });
      if (!method) {
        return res.status(400).json({ message: 'Método de pago no válido' });
      }
    }

    if (receipt.voucherUrl) {
      try {
        await azureBlobHelper.deleteFile(receipt.voucherUrl);
      } catch (err) {
        logger.warn('No se pudo eliminar comprobante anterior', { receiptId, error: err.message });
      }
    }

    const result = await azureBlobHelper.uploadFile(req.file.path, tenantId, 'receipts', {
      originalName: req.file.originalname,
    });

    const updated = await prisma.PaymentReceipts.update({
      where: { id: receiptId },
      data: {
        voucherUrl: result.url,
        voucherStatus: 'pending_review',
        voucherRejReason: null,
        status: 'pending',
        ...(paymentMethodId ? { paymentMethodId } : {}),
      },
      select: {
        id: true,
        voucherUrl: true,
        voucherStatus: true,
        paymentMethodId: true,
      },
    });

    await notifyComprobante(tenantId, idClient, { ...receipt, period: receipt.period });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Portal subirComprobante error', { error: error.message });
    res.status(500).json({ message: 'Error interno' });
  }
};
