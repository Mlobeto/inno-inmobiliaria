import { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import {
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoDocumentAttachOutline,
  IoEyeOutline,
  IoPersonOutline,
  IoTimeOutline,
} from 'react-icons/io5';

/**
 * Cola de comprobantes enviados por inquilinos desde el portal (voucherStatus = pending_review).
 */
const ComprobantesPendientes = ({
  payments,
  formatCurrency,
  onRefresh,
  onDownloadReceipt,
}) => {
  const [processingId, setProcessingId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const pending = payments.filter((p) => p.voucherStatus === 'pending_review' && p.voucherUrl);

  if (pending.length === 0) return null;

  const clientName = (p) => p.Clients?.name || p.Client?.name || 'Inquilino';
  const methodLabel = (p) => {
    const m = p.PaymentMethods;
    if (!m) return '—';
    return `${m.label} (${String(m.type).toUpperCase()})`;
  };

  const handleApprove = async (payment) => {
    const result = await Swal.fire({
      title: '¿Aprobar comprobante?',
      html: `
        <p style="text-align:left;margin:0 0 8px"><strong>Inquilino:</strong> ${clientName(payment)}</p>
        <p style="text-align:left;margin:0 0 8px"><strong>Período:</strong> ${payment.period || '—'}</p>
        <p style="text-align:left;margin:0"><strong>Monto:</strong> ${formatCurrency(payment.amount)}</p>
        <p style="text-align:left;margin:12px 0 0;font-size:13px;color:#94a3b8">
          El pago quedará registrado como cobrado y se generará la liquidación al propietario si corresponde.
        </p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#22c55e',
      cancelButtonColor: '#64748b',
      background: '#1e293b',
      color: '#fff',
      customClass: { popup: 'border border-white/10' },
    });

    if (!result.isConfirmed) return;

    setProcessingId(payment.id);
    try {
      await axios.put(`/payment/${payment.id}/aprobar-comprobante`);
      await Swal.fire({
        title: 'Comprobante aprobado',
        text: 'El pago fue registrado. Podés descargar el recibo desde el listado.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        background: '#1e293b',
        color: '#fff',
      });
      await onRefresh();
      if (onDownloadReceipt) {
        const { isConfirmed } = await Swal.fire({
          title: '¿Descargar recibo ahora?',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Descargar',
          cancelButtonText: 'Después',
          confirmButtonColor: '#3b82f6',
          cancelButtonColor: '#64748b',
          background: '#1e293b',
          color: '#fff',
        });
        if (isConfirmed) {
          const refreshed = await axios.get('/payment');
          const list = Array.isArray(refreshed.data) ? refreshed.data : [];
          const updated = list.find((p) => p.id === payment.id);
          if (updated?.Lease) onDownloadReceipt(updated);
        }
      }
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || err.message || 'No se pudo aprobar',
        icon: 'error',
        background: '#1e293b',
        color: '#fff',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    const { value: reason, isConfirmed } = await Swal.fire({
      title: 'Rechazar comprobante',
      input: 'textarea',
      inputLabel: 'Motivo (se mostrará al inquilino)',
      inputPlaceholder: 'Ej: el monto no coincide, comprobante ilegible…',
      inputAttributes: { 'aria-label': 'Motivo de rechazo' },
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      background: '#1e293b',
      color: '#fff',
      inputValidator: (v) => (!v?.trim() ? 'Ingresá un motivo' : undefined),
    });

    if (!isConfirmed || !reason?.trim()) return;

    setProcessingId(payment.id);
    try {
      await axios.put(`/payment/${payment.id}/rechazar-comprobante`, { reason: reason.trim() });
      await Swal.fire({
        title: 'Comprobante rechazado',
        text: 'El inquilino podrá enviar uno nuevo.',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
        background: '#1e293b',
        color: '#fff',
      });
      await onRefresh();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.response?.data?.error || err.message || 'No se pudo rechazar',
        icon: 'error',
        background: '#1e293b',
        color: '#fff',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className="bg-amber-500/10 backdrop-blur-xl rounded-2xl border border-amber-400/30 p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <IoDocumentAttachOutline className="w-6 h-6 text-amber-400" />
            Comprobantes por revisar
            <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              {pending.length}
            </span>
          </h3>
          <p className="text-slate-400 text-sm">
            Pagos informados por inquilinos desde el portal — aprobá para registrar el cobro
          </p>
        </div>

        <div className="space-y-4">
          {pending.map((payment) => (
            <div
              key={payment.id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col lg:flex-row lg:items-center gap-4"
            >
              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <IoPersonOutline className="w-3.5 h-3.5" /> Inquilino
                  </p>
                  <p className="text-white font-medium truncate">{clientName(payment)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <IoTimeOutline className="w-3.5 h-3.5" /> Cuota / período
                  </p>
                  <p className="text-white font-medium">
                    {payment.period || '—'}
                    {payment.installmentNumber && payment.totalInstallments && (
                      <span className="text-slate-400 font-normal">
                        {' '}
                        ({payment.installmentNumber}/{payment.totalInstallments})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Monto</p>
                  <p className="text-emerald-400 font-bold">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Cuenta informada</p>
                  <p className="text-slate-200 truncate" title={methodLabel(payment)}>
                    {methodLabel(payment)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewUrl(payment.voucherUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-200 text-sm border border-white/10 transition-colors"
                >
                  <IoEyeOutline className="w-4 h-4" />
                  Ver comprobante
                </button>
                <button
                  type="button"
                  disabled={processingId === payment.id}
                  onClick={() => handleReject(payment)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm border border-red-400/30 transition-colors disabled:opacity-50"
                >
                  <IoCloseCircleOutline className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  type="button"
                  disabled={processingId === payment.id}
                  onClick={() => handleApprove(payment)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm font-semibold border border-green-400/30 transition-colors disabled:opacity-50"
                >
                  <IoCheckmarkCircleOutline className="w-4 h-4" />
                  {processingId === payment.id ? 'Procesando…' : 'Aprobar pago'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-white/10 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h4 className="text-white font-semibold">Comprobante</h4>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
                aria-label="Cerrar"
              >
                <IoCloseCircleOutline className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center min-h-[200px]">
              {previewUrl.toLowerCase().includes('.pdf') ? (
                <iframe
                  title="Comprobante PDF"
                  src={previewUrl}
                  className="w-full h-[70vh] rounded-lg border border-white/10"
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Comprobante de pago"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              )}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm text-blue-400 hover:text-blue-300"
              >
                Abrir en pestaña nueva
              </a>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/15"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComprobantesPendientes;
