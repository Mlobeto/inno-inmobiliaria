/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { IoDocumentTextOutline } from 'react-icons/io5';

/**
 * LoteoVentaPdf — genera un PDF con el plan de venta/financiación de un lote.
 *
 * Props:
 *   venta  — objeto venta (incluye venta.cuotas[])
 *   lote   — objeto lote  ({ number, surface, price, currency, description })
 *   loteo  — objeto loteo ({ name, address, city, province })
 */
const LoteoVentaPdf = ({ venta, lote, loteo }) => {
  const [companySettings, setCompanySettings] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:3001/api';
        const res = await fetch(`${apiUrl}/admin/settings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (res.ok) setCompanySettings(await res.json());
      } catch {
        setCompanySettings({ company_name: 'Inmobiliaria' });
      }
    };
    load();
  }, []);

  const fmt = (value, currency = 'ARS') =>
    value != null
      ? new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency,
          minimumFractionDigits: 0,
        }).format(value)
      : '—';

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return d.toLocaleDateString('es-AR');
  };

  const periodicidadLabel = {
    MENSUAL: 'mensual',
    BIMESTRAL: 'bimestral',
    TRIMESTRAL: 'trimestral',
    SEMESTRAL: 'semestral',
    ANUAL: 'anual',
  };

  const generatePdf = () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    const colR = 130; // columna derecha
    let y = 15;

    const line = (x1, yy, x2) => doc.line(x1, yy, x2, yy);
    const text = (t, x, yy, opts) => doc.text(t, x, yy, opts);

    // ── ENCABEZADO EMPRESA ──────────────────────────────────────────────────
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    text(companySettings?.company_name || 'Inmobiliaria', margin, y);

    if (companySettings?.professional_title) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      y += 6;
      text(companySettings.professional_title, margin, y);
    }
    if (companySettings?.company_registration) {
      doc.setFontSize(8);
      y += 5;
      text(companySettings.company_registration, margin, y);
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y += 6;
    text(companySettings?.company_address || '', margin, y);
    y += 4;
    text(
      `${companySettings?.company_city || ''}, ${companySettings?.company_province || ''}`,
      margin,
      y,
    );
    y += 4;
    text(`Tel: ${companySettings?.company_phone || ''}`, margin, y);
    y += 4;
    text(companySettings?.company_email || '', margin, y);

    // ── TÍTULO ──────────────────────────────────────────────────────────────
    y += 12;
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    text('PLAN DE VENTA DE LOTE', pageW / 2, y, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y += 5;
    text(
      `Fecha: ${fmtDate(venta.fechaVenta)}`,
      pageW / 2,
      y,
      { align: 'center' },
    );

    y += 10;
    doc.setLineWidth(0.5);
    line(margin, y, pageW - margin);
    y += 8;

    // ── DATOS DEL LOTEO ─────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('DATOS DEL LOTEO', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(`Proyecto: ${loteo?.name || '—'}`, margin, y);
    y += 5;
    text(`Dirección: ${loteo?.address || '—'}`, margin, y);
    if (loteo?.city || loteo?.province) {
      y += 5;
      text(`Localidad: ${loteo?.city || ''}, ${loteo?.province || ''}`, margin, y);
    }

    // ── DATOS DEL LOTE ──────────────────────────────────────────────────────
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('DATOS DEL LOTE', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(`Lote N°: ${lote?.number ?? '—'}`, margin, y);
    if (lote?.surface) {
      text(`Superficie: ${lote.surface} m²`, colR, y);
    }
    if (lote?.description) {
      y += 5;
      const descLines = doc.splitTextToSize(lote.description, pageW - margin * 2);
      doc.text(descLines, margin, y);
      y += descLines.length * 5;
    }

    y += 6;
    line(margin, y, pageW - margin);
    y += 8;

    // ── DATOS DEL COMPRADOR ─────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('DATOS DEL COMPRADOR', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(`Nombre: ${venta.clienteNombre || '—'}`, margin, y);
    y += 5;
    if (venta.clienteCuil) {
      text(`CUIL / DNI: ${venta.clienteCuil}`, margin, y);
      y += 5;
    }
    if (venta.clienteTelefono) {
      text(`Teléfono: ${venta.clienteTelefono}`, margin, y);
      y += 5;
    }

    y += 4;
    line(margin, y, pageW - margin);
    y += 8;

    // ── CONDICIONES DE VENTA ────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('CONDICIONES DE VENTA', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const cur = venta.currency || 'ARS';
    text(`Precio total:`, margin, y);
    text(fmt(venta.precioTotal, cur), colR, y);
    y += 5;
    text(`Anticipo / Seña:`, margin, y);
    text(fmt(venta.anticipo, cur), colR, y);
    y += 5;
    text(`Saldo a financiar:`, margin, y);
    text(fmt(venta.saldo, cur), colR, y);
    y += 5;
    text(`Cantidad de cuotas:`, margin, y);
    text(
      `${venta.cantidadCuotas} cuota/s ${periodicidadLabel[venta.periodicidad] || venta.periodicidad}`,
      colR,
      y,
    );
    y += 5;
    text(`Valor de cada cuota:`, margin, y);
    text(fmt(venta.montoCuota, cur), colR, y);
    if (venta.interes > 0) {
      y += 5;
      text(`Interés aplicado:`, margin, y);
      text(`${venta.interes}%`, colR, y);
    }
    if (venta.notas) {
      y += 5;
      const notasLines = doc.splitTextToSize(`Notas: ${venta.notas}`, pageW - margin * 2);
      doc.text(notasLines, margin, y);
      y += notasLines.length * 5;
    }

    y += 6;
    line(margin, y, pageW - margin);
    y += 8;

    // ── TABLA DE CUOTAS ─────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('DETALLE DE CUOTAS', margin, y);
    y += 6;

    // Encabezado tabla
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
    text('N°', margin + 2, y);
    text('Vencimiento', margin + 15, y);
    text('Monto', margin + 55, y);
    text('Estado', margin + 90, y);
    text('Fecha de Pago', margin + 125, y);
    y += 4;
    doc.setLineWidth(0.2);
    line(margin, y, pageW - margin);
    y += 1;

    doc.setFont('helvetica', 'normal');

    const cuotas = venta.cuotas || [];
    cuotas.forEach((c, idx) => {
      // Nueva página si se acerca al final
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      // Fondo alternado
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3.5, pageW - margin * 2, 6, 'F');
      }

      doc.setFontSize(8);
      text(String(c.numeroCuota), margin + 2, y);
      text(fmtDate(c.fechaVencimiento), margin + 15, y);
      text(fmt(c.monto, cur), margin + 55, y);
      text(c.pagado ? 'Pagada' : 'Pendiente', margin + 90, y);
      text(c.pagado && c.fechaPago ? fmtDate(c.fechaPago) : '—', margin + 125, y);
      y += 6;
    });

    // Totales
    y += 2;
    line(margin, y, pageW - margin);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const pagadas = cuotas.filter(c => c.pagado).length;
    const montoPagado = cuotas.filter(c => c.pagado).reduce((s, c) => s + c.monto, 0);
    text(`Cuotas pagadas: ${pagadas} / ${cuotas.length}`, margin, y);
    text(`Total abonado: ${fmt(montoPagado, cur)}`, colR, y);

    // ── FIRMAS ──────────────────────────────────────────────────────────────
    if (y > 230) {
      doc.addPage();
      y = 30;
    } else {
      y += 25;
    }

    line(margin, y, margin + 70);
    line(pageW - margin - 70, y, pageW - margin);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    text('Comprador', margin + 20, y);
    text(`${companySettings?.company_name || 'Inmobiliaria'}`, pageW - margin - 55, y);

    // Nombre comprador debajo
    y += 4;
    doc.setFontSize(7);
    text(venta.clienteNombre || '', margin + 5, y);

    // ── PIE DE PÁGINA ────────────────────────────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Pág. ${i} / ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' },
      );
    }

    const fileName = `plan_venta_lote${lote?.number ?? ''}_${venta.clienteNombre?.replace(/\s+/g, '_') || 'cliente'}.pdf`;
    doc.save(fileName);
  };

  return (
    <button
      onClick={generatePdf}
      disabled={!companySettings}
      title={!companySettings ? 'Cargando configuración...' : 'Descargar plan de venta en PDF'}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <IoDocumentTextOutline className="w-4 h-4" />
      {companySettings ? 'Descargar PDF' : 'Cargando...'}
    </button>
  );
};

export default LoteoVentaPdf;
