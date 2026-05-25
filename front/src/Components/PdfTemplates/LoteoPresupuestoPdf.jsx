/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { IoDocumentTextOutline } from 'react-icons/io5';
import { previewCuotasSchedule } from '@shared/utils/loteCuotasSchedule';

const VALIDITY_DAYS = 15;

const periodicidadLabel = {
  MENSUAL: 'mensual',
  BIMESTRAL: 'bimestral',
  TRIMESTRAL: 'trimestral',
  SEMESTRAL: 'semestral',
  ANUAL: 'anual',
  PERSONALIZADO: 'fechas acordadas',
};

/**
 * Presupuesto PDF sin persistir venta — usa los datos del formulario del modal.
 */
const LoteoPresupuestoPdf = ({ ventaForm, lote, loteo, disabled = false }) => {
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

  const addDays = (dateStr, days) => {
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const generatePdf = () => {
    const fechaEmision = ventaForm.fechaVenta || new Date().toISOString().split('T')[0];
    const validoHasta = addDays(fechaEmision, VALIDITY_DAYS);
    const cur = ventaForm.currency || lote?.currency || 'ARS';

    const preview = previewCuotasSchedule({
      modoPlan: ventaForm.modoPlan || 'periodico',
      fechaVenta: fechaEmision,
      precioTotal: parseFloat(ventaForm.precioTotal) || 0,
      anticipo: parseFloat(ventaForm.anticipo) || 0,
      interes: parseFloat(ventaForm.interes) || 0,
      cantidadCuotas: parseInt(ventaForm.cantidadCuotas, 10) || 1,
      periodicidad: ventaForm.periodicidad || 'MENSUAL',
      diaVencimiento: parseInt(ventaForm.diaVencimiento, 10) || 10,
      cuotasCustom: ventaForm.cuotasPersonalizadas || [],
    });

    const { saldo, montoConInteres, montoCuota, cuotas } = preview;

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 18;
    const colR = 130;
    let y = 15;

    const line = (x1, yy, x2) => doc.line(x1, yy, x2, yy);
    const text = (t, x, yy, opts) => doc.text(t, x, yy, opts);

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
    text(`${companySettings?.company_city || ''}, ${companySettings?.company_province || ''}`, margin, y);
    y += 4;
    text(`Tel: ${companySettings?.company_phone || ''}`, margin, y);
    y += 4;
    text(companySettings?.company_email || '', margin, y);

    y += 12;
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    text('PRESUPUESTO DE VENTA DE LOTE', pageW / 2, y, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    y += 5;
    text(`Fecha: ${fmtDate(fechaEmision)}`, pageW / 2, y, { align: 'center' });
    y += 4;
    text(`Válido hasta: ${fmtDate(validoHasta)} (${VALIDITY_DAYS} días)`, pageW / 2, y, { align: 'center' });

    y += 8;
    doc.setLineWidth(0.5);
    line(margin, y, pageW - margin);
    y += 6;
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const disclaimer = doc.splitTextToSize(
      'Este documento es un presupuesto informativo. No constituye venta, reserva ni compromiso de disponibilidad del lote. Los valores y condiciones pueden variar hasta la formalización de la operación.',
      pageW - margin * 2,
    );
    doc.text(disclaimer, margin, y);
    doc.setTextColor(0, 0, 0);
    y += disclaimer.length * 4 + 6;

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

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('DATOS DEL LOTE', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(`Lote N°: ${lote?.number ?? '—'}`, margin, y);
    if (lote?.surface) text(`Superficie: ${lote.surface} m²`, colR, y);
    if (lote?.description) {
      y += 5;
      const descLines = doc.splitTextToSize(lote.description, pageW - margin * 2);
      doc.text(descLines, margin, y);
      y += descLines.length * 5;
    }

    y += 6;
    line(margin, y, pageW - margin);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('DATOS DEL INTERESADO', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(`Nombre: ${ventaForm.clienteNombre || '—'}`, margin, y);
    y += 5;
    if (ventaForm.clienteCuil) {
      text(`CUIL / DNI: ${ventaForm.clienteCuil}`, margin, y);
      y += 5;
    }
    if (ventaForm.clienteTelefono) {
      text(`Teléfono: ${ventaForm.clienteTelefono}`, margin, y);
      y += 5;
    }

    y += 4;
    line(margin, y, pageW - margin);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('CONDICIONES PROPUESTAS', margin, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text('Precio total:', margin, y);
    text(fmt(parseFloat(ventaForm.precioTotal) || 0, cur), colR, y);
    y += 5;
    text('Anticipo / Seña:', margin, y);
    text(fmt(parseFloat(ventaForm.anticipo) || 0, cur), colR, y);
    y += 5;
    text('Saldo a financiar:', margin, y);
    text(fmt(saldo, cur), colR, y);
    y += 5;
    const cantidadCuotas = ventaForm.modoPlan === 'personalizado'
      ? (ventaForm.cuotasPersonalizadas || []).filter((c) => c.fecha).length
      : parseInt(ventaForm.cantidadCuotas, 10) || 1;
    text('Cantidad de cuotas:', margin, y);
    text(
      `${cantidadCuotas} cuota/s ${periodicidadLabel[ventaForm.periodicidad] || ventaForm.periodicidad || 'mensual'}`,
      colR,
      y,
    );
    y += 5;
    text('Valor de cada cuota:', margin, y);
    text(fmt(montoCuota, cur), colR, y);
    if (parseFloat(ventaForm.interes) > 0) {
      y += 5;
      text('Total c/ interés:', margin, y);
      text(fmt(montoConInteres, cur), colR, y);
    }
    if (ventaForm.notas) {
      y += 5;
      const notasLines = doc.splitTextToSize(`Notas: ${ventaForm.notas}`, pageW - margin * 2);
      doc.text(notasLines, margin, y);
      y += notasLines.length * 5;
    }

    y += 6;
    line(margin, y, pageW - margin);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    text('CRONOGRAMA ESTIMADO DE CUOTAS', margin, y);
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
    text('N°', margin + 2, y);
    text('Vencimiento', margin + 15, y);
    text('Monto', margin + 55, y);
    text('Concepto', margin + 90, y);
    y += 4;
    doc.setLineWidth(0.2);
    line(margin, y, pageW - margin);
    y += 1;
    doc.setFont('helvetica', 'normal');

    cuotas.forEach((c, idx) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 3.5, pageW - margin * 2, 6, 'F');
      }
      text(c.numeroCuota === 0 ? 'Anticipo' : String(c.numeroCuota), margin + 2, y);
      const fechaStr = c.fechaVencimiento instanceof Date
        ? c.fechaVencimiento.toISOString()
        : c.fechaVencimiento;
      text(fmtDate(fechaStr), margin + 15, y);
      text(fmt(c.monto, cur), margin + 55, y);
      text(c.numeroCuota === 0 ? 'Seña / Anticipo' : `Cuota ${c.numeroCuota}`, margin + 90, y);
      y += 6;
    });

    y += 2;
    line(margin, y, pageW - margin);
    y += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    text(`Total presupuestado: ${fmt(parseFloat(ventaForm.precioTotal) || 0, cur)}`, margin, y);

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
    text('Interesado', margin + 18, y);
    text(companySettings?.company_name || 'Inmobiliaria', pageW - margin - 55, y);
    y += 4;
    doc.setFontSize(7);
    text(ventaForm.clienteNombre || '', margin + 5, y);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(`Pág. ${i} / ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    }

    const fileName = `presupuesto_lote${lote?.number ?? ''}_${(ventaForm.clienteNombre || 'cliente').replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  };

  const canGenerate = companySettings && ventaForm.clienteNombre?.trim() && Number(ventaForm.precioTotal) > 0;

  return (
    <button
      type="button"
      onClick={generatePdf}
      disabled={!canGenerate || disabled}
      title={
        !companySettings
          ? 'Cargando configuración...'
          : !ventaForm.clienteNombre?.trim()
            ? 'Ingresá el nombre del interesado'
            : !Number(ventaForm.precioTotal)
              ? 'Ingresá el precio total'
              : 'Generar presupuesto PDF (sin guardar venta)'
      }
      className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <IoDocumentTextOutline className="w-4 h-4" />
      {companySettings ? 'Presupuesto PDF' : 'Cargando...'}
    </button>
  );
};

export default LoteoPresupuestoPdf;
