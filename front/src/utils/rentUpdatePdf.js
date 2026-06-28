import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { parseSafeDate, formatDateSafe } from './dateUtils';

if (pdfFonts.pdfMake?.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts.default?.pdfMake) {
  pdfMake.vfs = pdfFonts.default.pdfMake.vfs;
} else {
  pdfMake.vfs = pdfFonts;
}

const MESES_POR_FRECUENCIA = { trimestral: 3, cuatrimestral: 4, semestral: 6, anual: 12 };

export function calcUpdatePeriod(lease, updateDate) {
  const start = parseSafeDate(lease.startDate);
  const update = parseSafeDate(updateDate);
  if (!start || !update) return 'Período desconocido';

  const monthsSinceStart =
    (update.getFullYear() - start.getFullYear()) * 12 +
    (update.getMonth() - start.getMonth());

  const freq = lease.updateFrequency;
  if (freq === 'trimestral') return `Trimestre ${Math.floor(monthsSinceStart / 3) + 1}`;
  if (freq === 'cuatrimestral') return `Cuatrimestre ${Math.floor(monthsSinceStart / 4) + 1}`;
  if (freq === 'semestral') return `Semestre ${Math.floor(monthsSinceStart / 6) + 1}`;
  if (freq === 'anual') return `Año ${Math.floor(monthsSinceStart / 12) + 1}`;
  return 'Período desconocido';
}

export function calcPercentIncrease(oldAmount, newAmount) {
  const anterior = parseFloat(oldAmount || 0);
  const nuevo = parseFloat(newAmount || 0);
  if (anterior === 0) return '0.00';
  return (((nuevo - anterior) / anterior) * 100).toFixed(2);
}

function formatearMonto(monto) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(parseFloat(monto || 0));
}

function replacePlaceholders(value, map) {
  if (typeof value === 'string') {
    return value.replace(/\{\{(\w+)\}\}/g, (_, key) => (map[key] != null ? String(map[key]) : ''));
  }
  if (Array.isArray(value)) return value.map((item) => replacePlaceholders(item, map));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = replacePlaceholders(v, map);
    }
    return out;
  }
  return value;
}

/** Plantilla pdfMake por defecto (misma estructura que QL, sin datos de inmobiliaria fijos). */
export function getDefaultRentUpdateTemplateJson() {
  return {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    defaultStyle: { font: 'Roboto' },
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center', color: '#1F2937' },
      title: { fontSize: 16, bold: true, alignment: 'center', color: '#3B82F6' },
      label: { fontSize: 10, bold: true, color: '#6B7280', margin: [0, 3, 0, 3] },
      value: { fontSize: 10, color: '#1F2937', margin: [0, 3, 0, 3] },
      sectionHeader: { fontSize: 12, bold: true, color: '#FFFFFF', alignment: 'center', margin: [10, 10, 10, 10] },
      amountLabel: { fontSize: 11, color: '#6B7280', alignment: 'center', margin: [0, 0, 0, 5] },
      amountOld: { fontSize: 18, color: '#EF4444', alignment: 'center', decoration: 'lineThrough' },
      amountNew: { fontSize: 22, bold: true, color: '#10B981', alignment: 'center' },
      percentage: { fontSize: 14, bold: true, color: '#3B82F6', alignment: 'center' },
      footer: { fontSize: 9, color: '#6B7280', alignment: 'center' },
      link: { fontSize: 9, color: '#3B82F6', decoration: 'underline', alignment: 'center' },
      signatureLabel: { fontSize: 9, alignment: 'center', color: '#6B7280' },
    },
    content: [
      { text: '{{companyName}}', style: 'header', margin: [0, 0, 0, 20] },
      { text: 'ACTUALIZACIÓN DE ALQUILER', style: 'title', margin: [0, 0, 0, 30] },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'ID del Contrato:', style: 'label' }, { text: '{{leaseId}}', style: 'value' }],
            [{ text: 'Fecha de Actualización:', style: 'label' }, { text: '{{updateDate}}', style: 'value' }],
            [{ text: 'Período:', style: 'label' }, { text: '{{periodo}}', style: 'value' }],
            [{ text: 'Frecuencia:', style: 'label' }, { text: '{{frequency}}', style: 'value' }],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          widths: ['30%', '70%'],
          body: [
            [{ text: 'Propiedad:', style: 'label' }, { text: '{{propertyAddress}}', style: 'value' }],
            [{ text: 'Inquilino:', style: 'label' }, { text: '{{tenantName}}', style: 'value' }],
            [{ text: 'Propietario:', style: 'label' }, { text: '{{landlordName}}', style: 'value' }],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 30],
      },
      {
        table: { widths: ['*'], body: [[{ text: 'DETALLES DE LA ACTUALIZACIÓN', style: 'sectionHeader' }]] },
        layout: { fillColor: '#3B82F6', hLineWidth: 0, vLineWidth: 0 },
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          { width: '50%', stack: [{ text: 'Monto Anterior', style: 'amountLabel' }, { text: '{{oldAmount}}', style: 'amountOld' }] },
          { width: '50%', stack: [{ text: 'Nuevo Monto', style: 'amountLabel' }, { text: '{{newAmount}}', style: 'amountNew' }] },
        ],
        margin: [0, 0, 0, 20],
      },
      { text: '{{percentLine}}', style: 'percentage', margin: [0, 0, 0, 30] },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#E5E7EB' }],
        margin: [0, 0, 0, 10],
      },
      { text: '{{indexFooter}}', style: 'footer', margin: [0, 10, 0, 5] },
      {
        text: [
          { text: 'Fuente: ', style: 'footer' },
          { text: '{{indexSourceUrl}}', style: 'link', link: '{{indexSourceUrl}}' },
        ],
        margin: [0, 0, 0, 30],
      },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
              { text: 'Firma del Propietario', style: 'signatureLabel', margin: [0, 5, 0, 0] },
            ],
          },
          {
            width: '50%',
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 0.5 }] },
              { text: 'Firma del Inquilino', style: 'signatureLabel', margin: [0, 5, 0, 0] },
            ],
          },
        ],
        margin: [0, 40, 0, 0],
      },
    ],
  };
}

export function buildPlaceholderMap({ lease, newRentAmount, updateDate, ipcIndex, companySettings }) {
  const pct = calcPercentIncrease(lease.rentAmount, newRentAmount);
  const periodo = calcUpdatePeriod(lease, updateDate);
  const indexSourceUrl = companySettings?.index_source_url || 'https://arquiler.com/';

  return {
    companyName: (companySettings?.company_name || 'INMOBILIARIA').toUpperCase(),
    leaseId: lease.id ?? 'N/A',
    updateDate: formatDateSafe(updateDate),
    periodo,
    frequency: (lease.updateFrequency || 'N/A').toUpperCase(),
    propertyAddress: lease.Property?.address || 'N/A',
    tenantName: lease.Tenant?.name || 'N/A',
    landlordName: lease.Landlord?.name || 'N/A',
    oldAmount: formatearMonto(lease.rentAmount),
    newAmount: formatearMonto(newRentAmount),
    percentLine: `Aumento: ${pct}%${ipcIndex ? ` (IPC: ${ipcIndex})` : ''}`,
    indexFooter: companySettings?.rent_index_footer || 'Cálculo realizado según índice de alquileres',
    indexSourceUrl,
  };
}

export function buildRentUpdateDocDefinition(params, customTemplateJson = null) {
  const map = buildPlaceholderMap(params);
  let template = getDefaultRentUpdateTemplateJson();

  if (customTemplateJson) {
    try {
      const parsed = typeof customTemplateJson === 'string' ? JSON.parse(customTemplateJson) : customTemplateJson;
      if (parsed.content) template = parsed;
    } catch {
      // fallback al default
    }
  }

  return replacePlaceholders(template, map);
}

export function downloadRentUpdatePdf(params, customTemplateJson = null) {
  const { lease, updateDate } = params;
  if (!lease || params.newRentAmount == null) {
    throw new Error('Faltan datos para generar el PDF');
  }

  const docDefinition = buildRentUpdateDocDefinition(params, customTemplateJson);
  const fechaArchivo = formatDateSafe(updateDate).replace(/\//g, '_');
  pdfMake.createPdf(docDefinition).download(`Actualizacion_Alquiler_${lease.id}_${fechaArchivo}.pdf`);
}

export function getNextUpdateDateFromLease(lease) {
  if (lease.updateInfo?.nextUpdateDate) {
    return parseSafeDate(lease.updateInfo.nextUpdateDate);
  }

  const inicio = parseSafeDate(lease.startDate);
  const mesesPeriodo = MESES_POR_FRECUENCIA[lease.updateFrequency] || 12;
  const hoy = new Date();
  if (!inicio) return null;

  const mesesTranscurridos =
    (hoy.getFullYear() - inicio.getFullYear()) * 12 +
    (hoy.getMonth() - inicio.getMonth());

  const periodosElapsed = Math.floor(mesesTranscurridos / mesesPeriodo);
  const proxima = parseSafeDate(inicio);
  proxima.setMonth(proxima.getMonth() + (periodosElapsed + 1) * mesesPeriodo);
  return proxima;
}

export function leaseNeedsUpdateSoon(lease, daysWindow = 20) {
  if (lease.status !== 'active') return false;
  if (lease.updateInfo?.shouldUpdate) return true;

  const proxima = getNextUpdateDateFromLease(lease);
  if (!proxima) return false;
  const diasRestantes = Math.ceil((proxima - new Date()) / (1000 * 60 * 60 * 24));
  return diasRestantes >= 0 && diasRestantes <= daysWindow;
}
