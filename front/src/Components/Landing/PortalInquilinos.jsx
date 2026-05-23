import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IoArrowBackOutline,
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoCloudUploadOutline,
  IoHomeOutline,
  IoTimeOutline,
} from 'react-icons/io5';
import {
  landingShell,
  landingHeader,
  landingCard,
  landingBtnPrimary,
  landingBtnGhost,
  landingSpinner,
  landingErrorBox,
} from './landingTheme';
import {
  clearPortalSession,
  fetchPortalMisPagos,
  getPortalClient,
  getPortalToken,
  informarPagoPortal,
  lookupPortalTenant,
  portalLogin,
  savePortalSession,
} from '../../utils/portalAuth';

const VOUCHER_LABELS = {
  none: null,
  pending_review: { text: 'En revisión', className: 'text-customYellow bg-customYellowMuted border-customYellow/30' },
  approved: { text: 'Aprobado', className: 'text-brand-light bg-brand-muted border-borderStrong' },
  rejected: { text: 'Rechazado', className: 'text-customRed bg-customRedMuted border-customRed/30' },
};

function formatCurrency(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(num || 0);
}

const PortalInquilinos = () => {
  const { subdomain } = useParams();
  const navigate = useNavigate();

  const [tenantInfo, setTenantInfo] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState(null);

  const [token, setToken] = useState(() => getPortalToken(subdomain));
  const [client, setClient] = useState(() => getPortalClient(subdomain));

  const [email, setEmail] = useState('');
  const [cuil, setCuil] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [pagosData, setPagosData] = useState(null);
  const [pagosLoading, setPagosLoading] = useState(false);

  const [uploadTarget, setUploadTarget] = useState(null);
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadingTenant(true);
        const info = await lookupPortalTenant(subdomain);
        if (!cancelled) {
          setTenantInfo(info);
          setTenantError(null);
        }
      } catch (err) {
        if (!cancelled) setTenantError(err.message);
      } finally {
        if (!cancelled) setLoadingTenant(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  const loadPagos = useCallback(async () => {
    const t = getPortalToken(subdomain);
    if (!t) return;
    setPagosLoading(true);
    try {
      const data = await fetchPortalMisPagos(subdomain, t);
      setPagosData(data);
    } catch (err) {
      toast.error(err.message || 'Error al cargar cuotas');
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('token')) {
        handleLogout();
      }
    } finally {
      setPagosLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    if (token) loadPagos();
  }, [token, loadPagos]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!tenantInfo?.tenantId) return;
    setLoginLoading(true);
    try {
      const data = await portalLogin(subdomain, {
        email: email.trim(),
        cuil: cuil.trim(),
        tenantId: tenantInfo.tenantId,
      });
      savePortalSession(subdomain, data.token, data.client);
      setToken(data.token);
      setClient(data.client);
      toast.success(`Bienvenido/a, ${data.client.name}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    clearPortalSession(subdomain);
    setToken(null);
    setClient(null);
    setPagosData(null);
    setUploadTarget(null);
  };

  const handleSubmitComprobante = async (e) => {
    e.preventDefault();
    if (!uploadTarget || !file || !paymentMethodId) {
      toast.error('Seleccioná la cuenta usada y subí el comprobante');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('leaseId', String(uploadTarget.leaseId));
    formData.append('installmentNumber', String(uploadTarget.installmentNumber));
    formData.append('paymentMethodId', paymentMethodId);

    setUploading(true);
    try {
      await informarPagoPortal(subdomain, token, formData);
      toast.success('Comprobante enviado. La inmobiliaria lo revisará pronto.');
      setUploadTarget(null);
      setFile(null);
      setPaymentMethodId('');
      await loadPagos();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loadingTenant) {
    return (
      <div className={`${landingShell} flex items-center justify-center`}>
        <div className={`w-12 h-12 ${landingSpinner}`} />
      </div>
    );
  }

  if (tenantError) {
    return (
      <div className={`${landingShell} flex items-center justify-center p-4`}>
        <div className={landingErrorBox}>
          <p className="text-textSecondary mb-4">{tenantError}</p>
          <button type="button" onClick={() => navigate(`/${subdomain}`)} className={landingBtnPrimary}>
            Volver a la inmobiliaria
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={landingShell}>
      <header className={landingHeader}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to={`/${subdomain}`} className={`${landingBtnGhost} text-sm`}>
            <IoArrowBackOutline className="w-4 h-4" />
            {tenantInfo?.businessName || 'Inmobiliaria'}
          </Link>
          {token && (
            <button type="button" onClick={handleLogout} className={`${landingBtnGhost} text-sm`}>
              Cerrar sesión
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {!token ? (
          <div className={`${landingCard} p-6 md:p-8`}>
            <div className="flex items-center gap-3 mb-6">
              {tenantInfo?.logo ? (
                <img src={tenantInfo.logo} alt="" className="w-12 h-12 rounded-full object-cover border border-borderBase" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-brand-muted flex items-center justify-center">
                  <IoHomeOutline className="w-6 h-6 text-brand-light" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-textPrimary">Portal de inquilinos</h1>
                <p className="text-textMuted text-sm">{tenantInfo?.businessName}</p>
              </div>
            </div>

            <p className="text-textSecondary text-sm mb-6 leading-relaxed">
              Ingresá con el email y CUIL registrados en tu contrato de alquiler para informar pagos de
              cuotas y subir comprobantes de transferencia.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-borderBase bg-bgElevated px-3 py-2.5 text-textPrimary focus:border-brand focus:outline-none"
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">CUIL</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cuil}
                  onChange={(e) => setCuil(e.target.value)}
                  required
                  className="w-full rounded-lg border border-borderBase bg-bgElevated px-3 py-2.5 text-textPrimary focus:border-brand focus:outline-none"
                  placeholder="20123456789"
                />
              </div>
              <button type="submit" disabled={loginLoading} className={`w-full justify-center ${landingBtnPrimary} py-3`}>
                {loginLoading ? 'Ingresando…' : 'Ingresar'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-textPrimary">Hola, {client?.name?.split(' ')[0]}</h1>
              <p className="text-textMuted text-sm mt-1">Cuotas de alquiler — {tenantInfo?.businessName}</p>
            </div>

            {pagosLoading && !pagosData ? (
              <div className="flex justify-center py-16">
                <div className={`w-10 h-10 ${landingSpinner}`} />
              </div>
            ) : (
              <>
                {(pagosData?.paymentMethods?.length ?? 0) > 0 && (
                  <section className={`${landingCard} p-5 mb-6`}>
                    <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-3 flex items-center gap-2">
                      <IoCardOutline className="w-4 h-4" />
                      Datos para transferir
                    </h2>
                    <ul className="space-y-3">
                      {pagosData.paymentMethods.map((m) => (
                        <li key={m.id} className="rounded-lg border border-borderBase bg-bgElevated p-3">
                          <p className="font-medium text-textPrimary text-sm">{m.label}</p>
                          <p className="text-brand-light text-sm mt-0.5 uppercase">{m.type}</p>
                          <p className="text-textSecondary text-sm mt-1 break-all select-all">{m.value}</p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section className={`${landingCard} p-5 mb-6`}>
                  <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-3 flex items-center gap-2">
                    <IoTimeOutline className="w-4 h-4" />
                    Cuotas pendientes
                  </h2>
                  {(pagosData?.pending?.length ?? 0) === 0 ? (
                    <p className="text-textMuted text-sm">No hay cuotas pendientes por informar.</p>
                  ) : (
                    <ul className="space-y-3">
                      {pagosData.pending.map((inst) => {
                        const voucher = VOUCHER_LABELS[inst.voucherStatus] || VOUCHER_LABELS.none;
                        return (
                          <li
                            key={`${inst.leaseId}-${inst.installmentNumber}`}
                            className="rounded-lg border border-borderBase bg-bgElevated p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-textPrimary">
                                  Cuota {inst.installmentNumber}/{inst.totalInstallments} — {inst.period}
                                </p>
                                {inst.propertyAddress && (
                                  <p className="text-textMuted text-xs mt-0.5">{inst.propertyAddress}</p>
                                )}
                                <p className="text-brand-light font-bold mt-1">{formatCurrency(inst.amount)}</p>
                              </div>
                              {voucher && (
                                <span className={`text-xs px-2 py-1 rounded-full border ${voucher.className}`}>
                                  {voucher.text}
                                </span>
                              )}
                            </div>
                            {inst.voucherStatus === 'rejected' && inst.voucherRejReason && (
                              <p className="text-customRed text-xs mt-2">Motivo: {inst.voucherRejReason}</p>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setUploadTarget(inst);
                                setPaymentMethodId('');
                                setFile(null);
                              }}
                              className={`mt-3 ${landingBtnPrimary} text-sm py-2`}
                            >
                              <IoCloudUploadOutline className="w-4 h-4" />
                              {inst.voucherUrl ? 'Reenviar comprobante' : 'Informar pago'}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>

                {(pagosData?.paid?.length ?? 0) > 0 && (
                  <section className={`${landingCard} p-5`}>
                    <h2 className="text-sm font-semibold text-textSecondary uppercase tracking-wide mb-3 flex items-center gap-2">
                      <IoCheckmarkCircleOutline className="w-4 h-4" />
                      Cuotas pagadas
                    </h2>
                    <ul className="space-y-2">
                      {pagosData.paid.map((inst) => (
                        <li
                          key={`paid-${inst.leaseId}-${inst.installmentNumber}`}
                          className="flex justify-between text-sm text-textSecondary py-2 border-b border-borderBase last:border-0"
                        >
                          <span>
                            {inst.period} — cuota {inst.installmentNumber}/{inst.totalInstallments}
                          </span>
                          <span className="text-brand-light font-medium">{formatCurrency(inst.amount)}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>

      {uploadTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`${landingCard} w-full max-w-md p-6`}>
            <h3 className="text-lg font-bold text-textPrimary mb-1">Informar pago</h3>
            <p className="text-textMuted text-sm mb-4">
              {uploadTarget.period} — {formatCurrency(uploadTarget.amount)}
            </p>
            <form onSubmit={handleSubmitComprobante} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">
                  ¿Con qué cuenta transferiste?
                </label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-borderBase bg-bgElevated px-3 py-2.5 text-textPrimary focus:border-brand focus:outline-none"
                >
                  <option value="">Seleccionar…</option>
                  {(pagosData?.paymentMethods || []).map((m) => (
                    <option key={m.id} value={m.id} className="bg-bgElevated">
                      {m.label} ({m.type})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-1">Comprobante</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                  className="w-full text-sm text-textSecondary file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand file:text-textWhite"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadTarget(null)}
                  className={`flex-1 justify-center ${landingBtnGhost}`}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={uploading} className={`flex-1 justify-center ${landingBtnPrimary}`}>
                  {uploading ? 'Enviando…' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalInquilinos;
