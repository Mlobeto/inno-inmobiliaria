/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { IoReceiptOutline } from 'react-icons/io5';
import { generateReciboPdf } from '../../utils/generateReciboPdf';
import { useReciboPdfAssets } from './useReciboPdfAssets';

/**
 * Recibo de pago de cuota de lote — mismo diseño que ReciboPdf (alquileres).
 */
const LoteoCuotaReciboPdf = ({
  cuota,
  venta,
  lote,
  loteo,
  autoGenerate = false,
  className = '',
  label = 'Recibo',
  iconOnly = false,
}) => {
  const { companySettings, signatureUrl, ready } = useReciboPdfAssets();
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const buildConcepto = () => {
    const loteRef = `Lote ${lote?.number ?? '—'}`;
    const proyecto = loteo?.name ? ` - ${loteo.name}` : '';
    if (cuota.numeroCuota === 0) {
      return `Anticipo / Seña - ${loteRef}${proyecto}`;
    }
    const totalFin = venta?.cantidadCuotas ?? '—';
    return `Cuota ${cuota.numeroCuota}/${totalFin} - ${loteRef}${proyecto}`;
  };

  const generatePdf = async () => {
    if (!companySettings) return;

    const receiptNumber = `${venta?.id || 0}${String(cuota.id || 0).padStart(4, '0')}`;
    const paymentDate = cuota.fechaPago || cuota.fechaVencimiento || new Date().toISOString();
    const cliente = venta?.clienteNombre || 'Cliente';
    const fileName = `Recibo_Lote${lote?.number ?? ''}_Cuota${cuota.numeroCuota === 0 ? 'Anticipo' : cuota.numeroCuota}_${cliente.replace(/\s+/g, '_')}.pdf`;

    await generateReciboPdf({
      companySettings,
      signatureUrl,
      payer: {
        name: venta?.clienteNombre,
        telefono: venta?.clienteTelefono,
        cuil: venta?.clienteCuil,
      },
      amount: cuota.monto,
      paymentDate,
      receiptNumber,
      concepto: buildConcepto(),
      fileName,
      download: true,
    });
    setPdfGenerated(true);
  };

  useEffect(() => {
    if (autoGenerate && ready && companySettings && !pdfGenerated) {
      generatePdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, ready, companySettings, pdfGenerated]);

  if (autoGenerate) return null;

  const baseClass = iconOnly
    ? 'p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50'
    : 'flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={generatePdf}
      disabled={!ready}
      title={!ready ? 'Cargando...' : 'Descargar recibo de pago'}
      className={`${baseClass} ${className}`}
    >
      <IoReceiptOutline className={iconOnly ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {!iconOnly && (ready ? label : '...')}
    </button>
  );
};

export default LoteoCuotaReciboPdf;
