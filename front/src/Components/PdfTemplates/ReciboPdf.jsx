import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { generateReciboPdf } from '../../utils/generateReciboPdf';
import { useReciboPdfAssets } from './useReciboPdfAssets';

const ReciboPdf = ({ payment, lease, autoGenerate = false }) => {
  const { companySettings, signatureUrl, ready } = useReciboPdfAssets();
  const [pdfGenerated, setPdfGenerated] = useState(false);

  const buildConcepto = () => {
    if (payment.type === 'initial') {
      return `Honorarios - ${lease.Property?.address || ''}`;
    }
    if (payment.type === 'commission') {
      return `Comision - ${lease.Property?.address || ''}`;
    }
    return `Cuota ${payment.installmentNumber}/${lease.totalMonths} ${payment.period} - ${lease.Property?.address || ''}`;
  };

  const generatePdf = async () => {
    if (!companySettings) return;

    const tenant = lease?.Tenant || {};
    const receiptNumber = payment.id || 0;
    const fileName = `Recibo_${String(receiptNumber).padStart(8, '0')}_${tenant.name || 'Cliente'}.pdf`;

    await generateReciboPdf({
      companySettings,
      signatureUrl,
      payer: {
        name: tenant.name,
        direccion: tenant.direccion,
        ciudad: tenant.ciudad,
        provincia: tenant.provincia,
        telefono: tenant.telefono,
      },
      amount: payment.amount,
      paymentDate: payment.paymentDate,
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

  if (autoGenerate) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        onClick={generatePdf}
        disabled={!ready}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        title={!ready ? 'Cargando configuración...' : ''}
      >
        {ready ? 'Generar Recibo PDF' : 'Cargando...'}
      </button>
    </div>
  );
};

ReciboPdf.propTypes = {
  payment: PropTypes.object.isRequired,
  lease: PropTypes.object.isRequired,
  autoGenerate: PropTypes.bool,
};

export default ReciboPdf;
