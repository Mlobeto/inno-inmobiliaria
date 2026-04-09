const jwt = require('jsonwebtoken');
const prisma = require('../utils/prismaClient');
const azureBlobHelper = require('../utils/azureBlobHelper');
const logger = require('../utils/logger');

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
      select: { tenantId: true, businessName: true, logo: true },
    });

    if (!tenant) {
      return res.status(404).json({ message: 'No se encontró una inmobiliaria con ese código' });
    }

    return res.json({ tenantId: tenant.tenantId, businessName: tenant.businessName, logo: tenant.logo });
  } catch (err) {
    logger.error('PortalController.lookupTenant error:', err);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/portal/auth
 * Body: { email, cuil, tenantId? }
 * Header opcional: X-Tenant-Id
 *
 * Identifica al inquilino por email + cuil dentro del tenant.
 * Devuelve JWT con { idClient, tenantId, role: 'INQUILINO' }.
 */
exports.login = async (req, res) => {
  try {
    const { email, cuil } = req.body;

    if (!email || !cuil) {
      return res.status(400).json({ message: 'email y cuil son requeridos' });
    }

    // Resolver tenantId: del body, del header, o del middleware de tenancy
    const tenantId = req.body.tenantId
      ? parseInt(req.body.tenantId, 10)
      : req.tenantId || null;

    if (!tenantId) {
      return res.status(400).json({ message: 'No se pudo identificar la inmobiliaria' });
    }

    // Buscar el cliente dentro del tenant por email y cuil
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

    // Verificar cuil (guardado sin formato, comparar solo dígitos)
    const normalize = (v) => (v || '').replace(/\D/g, '');
    if (normalize(client.cuil) !== normalize(cuil)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
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

// ─── Mis pagos ─────────────────────────────────────────────────────────────────

/**
 * GET /api/portal/mis-pagos
 * Devuelve las cuotas del inquilino con sus datos de comprobante
 * y los métodos de pago activos del tenant.
 */
exports.getMisPagos = async (req, res) => {
  try {
    const { idClient, tenantId } = req.portalClient;

    const [receipts, paymentMethods] = await Promise.all([
      prisma.PaymentReceipts.findMany({
        where: {
          idClient,
          tenantId,
          deletedAt: null,
          type: 'installment',
        },
        select: {
          id: true,
          period: true,
          amount: true,
          originalAmount: true,
          originalCurrency: true,
          paymentDate: true,
          status: true,
          voucherUrl: true,
          voucherStatus: true,
          voucherRejReason: true,
          paidAt: true,
          installmentNumber: true,
          totalInstallments: true,
        },
        orderBy: { paymentDate: 'asc' },
      }),
      prisma.PaymentMethods.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, type: true, label: true, value: true },
      }),
    ]);

    res.status(200).json({ success: true, data: { receipts, paymentMethods } });
  } catch (error) {
    logger.error('Portal getMisPagos error', { error: error.message });
    res.status(500).json({ message: 'Error interno' });
  }
};

// ─── Subir comprobante ─────────────────────────────────────────────────────────

/**
 * POST /api/portal/pago/:id/comprobante
 * Multipart: file (imagen/pdf del comprobante)
 * Sube el archivo a Azure Blob y actualiza voucherUrl + voucherStatus = pending_review
 */
exports.subirComprobante = async (req, res) => {
  try {
    const { idClient, tenantId } = req.portalClient;
    const receiptId = parseInt(req.params.id, 10);
    const filePath = req.file?.path;

    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    // Verificar que el recibo pertenece al inquilino
    const receipt = await prisma.PaymentReceipts.findFirst({
      where: { id: receiptId, idClient, tenantId, deletedAt: null },
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Cuota no encontrada' });
    }

    if (receipt.voucherStatus === 'approved') {
      return res.status(400).json({ message: 'Esta cuota ya fue aprobada' });
    }

    // Si había un comprobante anterior, eliminar de Azure Blob
    if (receipt.voucherUrl) {
      try {
        await azureBlobHelper.deleteFile(receipt.voucherUrl);
      } catch (err) {
        logger.warn('No se pudo eliminar comprobante anterior', { receiptId, error: err.message });
      }
    }

    // Subir nuevo comprobante
    const result = await azureBlobHelper.uploadFile(filePath, tenantId, 'receipts', {
      originalName: req.file.originalname,
    });

    // Actualizar recibo
    const updated = await prisma.PaymentReceipts.update({
      where: { id: receiptId },
      data: {
        voucherUrl: result.url,
        voucherStatus: 'pending_review',
        voucherRejReason: null,
      },
      select: { id: true, voucherUrl: true, voucherStatus: true },
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    logger.error('Portal subirComprobante error', { error: error.message });
    res.status(500).json({ message: 'Error interno' });
  }
};
