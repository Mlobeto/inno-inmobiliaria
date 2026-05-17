const prisma = require('../utils/prismaClient');
const puppeteer = require('puppeteer');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n));

const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '—';

// ─────────────────────────────────────────────────────────────────────────────
// GET /owner-settlements  — lista con filtros opcionales
// ─────────────────────────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { status, landlordId, period, page = 1, limit = 50 } = req.query;

    const where = { tenantId };
    if (status)     where.status     = status;
    if (landlordId) where.landlordId = parseInt(landlordId);
    if (period)     where.period     = { contains: period, mode: 'insensitive' };

    const [settlements, total] = await Promise.all([
      prisma.OwnerSettlements.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.OwnerSettlements.count({ where }),
    ]);

    return res.json({ success: true, settlements, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('OwnerSettlementController.list:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener liquidaciones' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /owner-settlements/summary  — totales pendientes/liquidados
// ─────────────────────────────────────────────────────────────────────────────
exports.summary = async (req, res) => {
  try {
    const { tenantId } = req.user;

    const rows = await prisma.OwnerSettlements.groupBy({
      by: ['status'],
      where: { tenantId },
      _sum: { grossAmount: true, commissionAmt: true, netAmount: true },
      _count: { id: true },
    });

    const result = { pending: null, liquidated: null };
    for (const r of rows) {
      result[r.status] = {
        count:         r._count.id,
        grossAmount:   r._sum.grossAmount,
        commissionAmt: r._sum.commissionAmt,
        netAmount:     r._sum.netAmount,
      };
    }

    return res.json({ success: true, summary: result });
  } catch (err) {
    console.error('OwnerSettlementController.summary:', err);
    return res.status(500).json({ success: false, message: 'Error al obtener resumen' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /owner-settlements/liquidate  — marcar como liquidado (uno o varios)
// Body: { ids: [1,2,3], liquidationNote?: string }
// ─────────────────────────────────────────────────────────────────────────────
exports.liquidate = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { ids, liquidationNote } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Debe enviar al menos un id' });
    }

    const updated = await prisma.OwnerSettlements.updateMany({
      where: { id: { in: ids.map(Number) }, tenantId, status: 'pending' },
      data: { status: 'liquidated', liquidatedAt: new Date(), liquidationNote: liquidationNote || null },
    });

    return res.json({ success: true, updated: updated.count });
  } catch (err) {
    console.error('OwnerSettlementController.liquidate:', err);
    return res.status(500).json({ success: false, message: 'Error al liquidar' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /owner-settlements/pdf/:landlordId  — PDF agrupado por propietario
// Query: period? (filtrar por período), status? (default: pending)
// ─────────────────────────────────────────────────────────────────────────────
exports.generatePdf = async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { landlordId } = req.params;
    const { period, status = 'pending' } = req.query;

    const where = { tenantId, landlordId: parseInt(landlordId), status };
    if (period) where.period = { contains: period, mode: 'insensitive' };

    const settlements = await prisma.OwnerSettlements.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    if (!settlements.length) {
      return res.status(404).json({ success: false, message: 'No hay liquidaciones para este propietario' });
    }

    // Obtener configuración del tenant (nombre de la inmobiliaria, logo)
    const adminSettings = await prisma.adminSettings.findFirst({ where: { tenantId } });

    const totals = settlements.reduce((acc, s) => ({
      gross:      acc.gross      + Number(s.grossAmount),
      commission: acc.commission + Number(s.commissionAmt),
      net:        acc.net        + Number(s.netAmount),
    }), { gross: 0, commission: 0, net: 0 });

    const html = buildSettlementHtml({ settlements, totals, landlordName: settlements[0].landlordName, adminSettings, period });

    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="liquidacion-${settlements[0].landlordName.replace(/\s+/g, '-')}.pdf"`);
    return res.send(pdf);
  } catch (err) {
    console.error('OwnerSettlementController.generatePdf:', err);
    return res.status(500).json({ success: false, message: 'Error al generar PDF' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Función interna: crear liquidación a partir de un pago
// Llamada desde PaymentController.createPayment
// ─────────────────────────────────────────────────────────────────────────────
exports.createFromPayment = async ({ tenantId, paymentReceipt, lease }) => {
  try {
    if (!lease || !lease.landlordId) return;

    // Solo para cuotas de alquiler (installment)
    if (paymentReceipt.type !== 'installment') return;

    const commissionPct = Number(lease.commission ?? lease.Property?.comision ?? 0);
    if (commissionPct === 0) return; // sin comisión configurada, no generar liquidación

    const gross         = Number(paymentReceipt.amount);
    const commissionAmt = parseFloat((gross * commissionPct / 100).toFixed(2));
    const netAmount     = parseFloat((gross - commissionAmt).toFixed(2));

    const landlord = await prisma.Clients.findUnique({ where: { idClient: lease.landlordId } });

    await prisma.OwnerSettlements.create({
      data: {
        tenantId,
        leaseId:         lease.id,
        paymentReceiptId: paymentReceipt.id,
        landlordId:      lease.landlordId,
        landlordName:    landlord?.name ?? 'Propietario',
        propertyId:      lease.propertyId,
        propertyAddress: lease.Property?.address ?? '',
        grossAmount:     gross,
        commissionPct,
        commissionAmt,
        netAmount,
        currency:        paymentReceipt.originalCurrency === 'USD' ? 'USD' : 'ARS',
        originalAmount:  paymentReceipt.originalAmount ?? null,
        originalCurrency: paymentReceipt.originalCurrency ?? 'ARS',
        dolarRateUsed:   paymentReceipt.dolarRateUsed ?? null,
        period:          paymentReceipt.period,
        status:          'pending',
      },
    });
  } catch (err) {
    // No fallar el pago si la liquidación no se crea
    console.error('createFromPayment (OwnerSettlement):', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HTML del PDF
// ─────────────────────────────────────────────────────────────────────────────
function buildSettlementHtml({ settlements, totals, landlordName, adminSettings, period }) {
  const companyName = adminSettings?.company_name ?? 'Inmobiliaria';
  const companyAddress = adminSettings?.company_address ?? '';
  const companyPhone   = adminSettings?.company_phone ?? '';
  const logoUrl        = adminSettings?.company_logo_url ?? '';
  const now            = new Date().toLocaleDateString('es-AR');

  const rows = settlements.map(s => `
    <tr>
      <td>${s.propertyAddress}</td>
      <td>${s.period}</td>
      <td style="text-align:right">${formatARS(s.grossAmount)}</td>
      <td style="text-align:right">${s.commissionPct}%</td>
      <td style="text-align:right;color:#dc2626">(${formatARS(s.commissionAmt)})</td>
      <td style="text-align:right;font-weight:600;color:#16a34a">${formatARS(s.netAmount)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    body{font-family:Arial,sans-serif;font-size:12px;color:#1e293b;margin:0}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #3b82f6}
    .company h2{margin:0;font-size:16px;color:#1e3a8a}
    .company p{margin:2px 0;font-size:11px;color:#64748b}
    .logo img{height:48px;object-fit:contain}
    h1{font-size:18px;color:#1e3a8a;margin:0 0 4px}
    .meta{font-size:11px;color:#64748b;margin-bottom:20px}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#1e3a8a;color:#fff;padding:8px;text-align:left;font-size:11px}
    td{padding:7px 8px;border-bottom:1px solid #e2e8f0;font-size:11px}
    tr:nth-child(even) td{background:#f8fafc}
    .totals td{font-weight:600;border-top:2px solid #1e3a8a;background:#f1f5f9}
    .totals .net{color:#16a34a;font-size:13px}
    .footer{margin-top:32px;font-size:10px;color:#94a3b8;text-align:center;border-top:1px solid #e2e8f0;padding-top:8px}
    .badge-pending{display:inline-block;padding:2px 8px;background:#fef9c3;color:#854d0e;border-radius:4px;font-size:10px}
    .badge-liquidated{display:inline-block;padding:2px 8px;background:#dcfce7;color:#166534;border-radius:4px;font-size:10px}
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h2>${companyName}</h2>
      ${companyAddress ? `<p>${companyAddress}</p>` : ''}
      ${companyPhone   ? `<p>${companyPhone}</p>`   : ''}
    </div>
    ${logoUrl ? `<div class="logo"><img src="${logoUrl}" alt="logo"/></div>` : ''}
  </div>

  <h1>Liquidación al Propietario</h1>
  <div class="meta">
    <strong>Propietario:</strong> ${landlordName} &nbsp;·&nbsp;
    ${period ? `<strong>Período:</strong> ${period} &nbsp;·&nbsp;` : ''}
    <strong>Emitida:</strong> ${now}
  </div>

  <table>
    <thead>
      <tr>
        <th>Propiedad</th>
        <th>Período</th>
        <th style="text-align:right">Alquiler bruto</th>
        <th style="text-align:right">Comisión %</th>
        <th style="text-align:right">Honorarios</th>
        <th style="text-align:right">Neto a liquidar</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr class="totals">
        <td colspan="2">TOTAL</td>
        <td style="text-align:right">${formatARS(totals.gross)}</td>
        <td></td>
        <td style="text-align:right;color:#dc2626">(${formatARS(totals.commission)})</td>
        <td style="text-align:right" class="net">${formatARS(totals.net)}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    Documento generado por ${companyName} · GestProp — ${now}
  </div>
</body>
</html>`;
}
