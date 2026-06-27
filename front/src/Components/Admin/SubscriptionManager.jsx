import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  IoCardOutline,
  IoCheckmarkCircle,
  IoCheckmarkCircleOutline,
  IoCloseCircle,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoArrowBackOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoReceiptOutline,
  IoLayersOutline,
  IoGlobeOutline,
  IoStorefrontOutline,
  IoPeopleCircleOutline,
  IoMapOutline,
  IoFunnelOutline,
  IoKeyOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoCalendarOutline,
  IoHomeOutline,
} from 'react-icons/io5';
import {
  panelShell,
  panelContainer,
  backLink,
  btnPrimary,
  btnSecondary,
  card,
  statCard,
  alertError,
  tableWrap,
  tableHeadRow,
  tableTh,
  tableRow,
} from './adminPanelTheme';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const MODULE_ICONS = {
  temporary_rentals: IoCalendarOutline,
  landing:           IoGlobeOutline,
  leads_team:        IoPeopleCircleOutline,
  mercadolibre:      IoStorefrontOutline,
  loteos:            IoMapOutline,
  portal_inquilino:  IoHomeOutline,
};

const STATUSES_NEEDING_PAYMENT = ['past_due', 'canceled', 'incomplete', 'expired'];

function subscriptionNeedsPayment(sub) {
  if (!sub) return true;
  const status = sub?.status?.toLowerCase() || '';
  const trialEnded =
    ['trialing', 'trial'].includes(status) &&
    sub.trialEnd &&
    new Date(sub.trialEnd) <= new Date();
  if (trialEnded) return true;
  return STATUSES_NEEDING_PAYMENT.includes(status);
}

function isTrialExpired(sub) {
  if (!sub?.trialEnd || !sub?.status) return false;
  const status = String(sub.status).toLowerCase();
  if (!['trialing', 'trial'].includes(status)) return false;
  return new Date(sub.trialEnd) <= new Date();
}

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const [subscription, setSubscription] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [tenantModules, setTenantModules] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingModule, setIsChangingModule] = useState(null); // moduleId en proceso

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [subRes, allModRes, tenantModRes] = await Promise.all([
        axios.get(`${API_URL}/subscriptions/current`, { headers }),
        axios.get(`${API_URL}/modules`),
        axios.get(`${API_URL}/modules/tenant`, { headers }),
      ]);

      setSubscription(subRes.data?.subscription || null);
      setAllModules(allModRes.data?.modules || []);
      setTenantModules(tenantModRes.data?.modules || []);

      try {
        const paymentsRes = await axios.get(`${API_URL}/subscriptions/payment-history`, { headers });
        setPaymentHistory(paymentsRes.data?.payments || []);
      } catch {
        /* historial opcional */
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar información de la suscripción');
      setIsLoading(false);
    }
  };

  const activeModuleIds = new Set(tenantModules.map((tm) => tm.moduleId));

  const handleActivateModule = async (moduleId) => {
    if (!window.confirm('¿Querés agregar este módulo? El precio de tu suscripción se actualizará.')) return;
    setIsChangingModule(moduleId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/modules/activate`,
        { moduleIds: [moduleId] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Módulo activado. Nuevo total: ${formatCurrency(res.data.newTotalPrice)}/mes`);
      await loadSubscriptionData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al activar módulo');
    } finally {
      setIsChangingModule(null);
    }
  };

  const handleDeactivateModule = async (moduleId) => {
    if (!window.confirm('¿Querés desactivar este módulo? Perderás acceso a esas funcionalidades.')) return;
    setIsChangingModule(moduleId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/modules/deactivate`,
        { moduleId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(`Módulo desactivado. Nuevo total: ${formatCurrency(res.data.newTotalPrice)}/mes`);
      await loadSubscriptionData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al desactivar módulo');
    } finally {
      setIsChangingModule(null);
    }
  };

  const handleCreateSubscription = async () => {
    if (!window.confirm(
      'Vas a Mercado Pago para activar la suscripción.\n\n' +
      '• Las suscripciones se debitan mensualmente con tarjeta de crédito o débito.\n\n' +
      '¿Continuar?'
    )) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/subscriptions/create-subscription`,
        { planId: 'base' },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      window.location.href = response.data.subscriptionUrl;
    } catch (error) {
      const data = error.response?.data;
      toast.error(data?.error || error.message || 'Error al crear la suscripción', { autoClose: 12000 });
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { className: 'bg-brand-muted text-brand-light border-borderStrong', icon: IoCheckmarkCircleOutline, text: 'Activo' },
      trialing: { className: 'bg-customBlueMuted text-customBlue border-customBlue/30', icon: IoTimeOutline, text: 'Periodo de prueba' },
      trial: { className: 'bg-customBlueMuted text-customBlue border-customBlue/30', icon: IoTimeOutline, text: 'Periodo de prueba' },
      past_due: { className: 'bg-customRedMuted text-customRed border-customRed/30', icon: IoCloseCircleOutline, text: 'Vencido' },
      canceled: { className: 'bg-bgElevated text-textMuted border-borderBase', icon: IoCloseCircleOutline, text: 'Cancelado' },
      incomplete: { className: 'bg-customYellowMuted text-customYellow border-customYellow/30', icon: IoWarningOutline, text: 'Incompleto' },
    };

    const normalizedStatus = status?.toLowerCase() || '';
    const badge = badges[normalizedStatus] || {
      className: 'bg-bgElevated text-textSecondary border-borderBase',
      icon: IoInformationCircleOutline,
      text: status || 'Desconocido',
    };
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.className}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  if (isLoading) {
    return (
      <div className={`${panelShell} flex items-center justify-center min-h-screen`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  const statusNorm = subscription?.status?.toLowerCase() || '';
  const trialExpired = isTrialExpired(subscription);
  const isVencida =
    isExpired ||
    trialExpired ||
    ['past_due', 'canceled', 'incomplete'].includes(statusNorm);

  return (
    <div className={panelShell}>
      <div className={`${panelContainer} max-w-6xl`}>
        <header className="mb-6">
          <button type="button" onClick={() => navigate('/panel')} className={`${backLink} mb-4`}>
            <IoArrowBackOutline className="w-4 h-4" />
            Volver al panel
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary flex items-center gap-3">
            <IoCardOutline className="w-8 h-8 text-brand-light shrink-0" />
            Mi suscripción
          </h1>
          <p className="text-textSecondary text-sm mt-1">Plan, facturación y métodos de pago</p>
        </header>

        {isVencida && (
          <div className={`${alertError} mb-6 p-4 rounded-xl`}>
            <div className="flex items-start gap-3">
              <IoWarningOutline className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-textPrimary mb-1">
                  {statusNorm === 'past_due'
                    ? 'Tu suscripción está vencida'
                    : statusNorm === 'canceled'
                      ? 'Tu suscripción fue cancelada'
                      : 'Tu período de prueba ha expirado'}
                </h3>
                <p className="text-sm text-textSecondary mb-4 leading-relaxed">
                  {statusNorm === 'past_due'
                    ? 'El acceso está restringido. Realizá el pago para reactivar tu cuenta.'
                    : statusNorm === 'canceled'
                      ? 'Contratá un plan y completá el pago a través de Mercado Pago para volver a usar la plataforma.'
                      : 'Seleccioná un plan y completá el pago para continuar.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('available-plans');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    else handleCreateSubscription();
                  }}
                  className={btnPrimary}
                >
                  <IoCardOutline className="w-4 h-4" />
                  Contratar plan
                </button>
              </div>
            </div>
          </div>
        )}

        {subscription?.status === 'trialing' && (() => {
          const now = new Date();
          const trialEnd = new Date(subscription.trialEnd);
          const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));

          return (
            <div className={`${card} mb-6 p-5 border-customBlue/30 bg-customBlueMuted/20`}>
              <div className="flex items-start gap-4">
                <div className="rounded-lg p-2.5 bg-customBlueMuted border border-customBlue/30 shrink-0">
                  <IoTimeOutline className="w-6 h-6 text-customBlue" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-textPrimary mb-1">Período de prueba activo</h3>
                  <p className="text-sm text-textSecondary mb-4">
                    Estás usando <strong className="text-textPrimary">{subscription.Plan?.name}</strong> sin cargo.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-3">
                    <div className={statCard}>
                      <p className="text-xs text-textMuted mb-0.5">Tiempo restante</p>
                      <p className="text-2xl font-bold text-textPrimary">
                        {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                      </p>
                    </div>
                    <div className={statCard}>
                      <p className="text-xs text-textMuted mb-0.5">Finaliza el</p>
                      <p className="text-base font-semibold text-textPrimary">{formatDate(subscription.trialEnd)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-textMuted">
                    Al finalizar el trial deberás configurar un método de pago para seguir operando.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        <div className={`${card} p-5 sm:p-6 mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-semibold text-textPrimary flex items-center gap-2">
              <IoLayersOutline className="w-5 h-5 text-brand-light" />
              Mi suscripción
            </h2>
            {getStatusBadge(subscription?.status)}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className={statCard}>
              <p className="text-xs text-textMuted mb-0.5">Plan</p>
              <p className="text-lg font-bold text-textPrimary">Plan Base</p>
              <p className="text-sm text-textSecondary mt-1">{formatCurrency(10000)}/mes</p>
            </div>
            <div className={statCard}>
              <p className="text-xs text-textMuted mb-0.5">Módulos activos</p>
              <p className="text-2xl font-bold text-textPrimary">{tenantModules.length}</p>
            </div>
            <div className={statCard}>
              <p className="text-xs text-textMuted mb-0.5">Total mensual</p>
              <p className="text-lg font-bold text-textPrimary">
                {formatCurrency(parseFloat(subscription?.amount || 10000))}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className={statCard}>
              <p className="text-xs text-textMuted mb-0.5">
                {subscription?.status === 'trialing' ? 'Trial termina' : 'Próxima renovación'}
              </p>
              <p className="text-sm font-semibold text-textPrimary">
                {subscription?.status === 'trialing'
                  ? formatDate(subscription?.trialEnd)
                  : formatDate(subscription?.currentPeriodEnd)}
              </p>
            </div>
            <div className={statCard}>
              <p className="text-xs text-textMuted mb-0.5">Inicio</p>
              <p className="text-sm font-semibold text-textPrimary">{formatDate(subscription?.currentPeriodStart)}</p>
            </div>
          </div>
        </div>

        {/* Módulos activos */}
        {tenantModules.length > 0 && (
          <div className={`${card} p-5 sm:p-6 mb-6`}>
            <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
              <IoCheckmarkCircle className="w-5 h-5 text-brand-light" />
              Módulos activos
            </h2>
            <div className="space-y-3">
              {tenantModules.map((tm) => {
                const mod = tm.modules || allModules.find(m => m.moduleId === tm.moduleId);
                if (!mod) return null;
                const Icon = MODULE_ICONS[mod.moduleId] || IoLayersOutline;
                return (
                  <div key={mod.moduleId} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-brand-muted/30 border border-borderStrong">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-brand-muted border border-borderStrong">
                        <Icon className="w-5 h-5 text-brand-light" />
                      </div>
                      <div>
                        <p className="font-medium text-textPrimary text-sm">{mod.name}</p>
                        <p className="text-xs text-textMuted">{formatCurrency(mod.price)}/mes</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeactivateModule(mod.moduleId)}
                      disabled={isChangingModule === mod.moduleId}
                      className="text-customRed hover:text-customRedDark text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                      {isChangingModule === mod.moduleId ? 'Procesando...' : 'Quitar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Módulos disponibles para agregar */}
        <div id="available-plans" className={`${card} p-5 sm:p-6 mb-6 scroll-mt-4`}>
          <h2 className="text-lg font-semibold text-textPrimary mb-2 flex items-center gap-2">
            <IoAddCircleOutline className="w-5 h-5 text-brand-light" />
            {allModules.filter(m => !activeModuleIds.has(m.moduleId)).length === 0
              ? 'Módulos disponibles'
              : 'Agregar módulos'}
          </h2>
          <p className="text-sm text-textMuted mb-5">
            Sumá funcionalidades a tu plan. Se descuentan junto con tu suscripción mensual.
          </p>

          {allModules.filter(m => !activeModuleIds.has(m.moduleId)).length === 0 ? (
            <p className="text-textMuted text-sm text-center py-6">🎉 Tenés todos los módulos activos</p>
          ) : (
            <div className="space-y-3">
              {allModules
                .filter(m => !activeModuleIds.has(m.moduleId))
                .map((mod) => {
                  const Icon = MODULE_ICONS[mod.moduleId] || IoLayersOutline;
                  return (
                    <div key={mod.moduleId} className="flex items-center justify-between gap-4 p-4 rounded-xl border border-borderBase bg-bgElevated/40 hover:border-borderStrong transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-bgSurface border border-borderBase">
                          <Icon className="w-5 h-5 text-textMuted" />
                        </div>
                        <div>
                          <p className="font-medium text-textPrimary text-sm">{mod.name}</p>
                          <p className="text-xs text-textMuted mt-0.5">{mod.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-textPrimary">+{formatCurrency(mod.price)}</p>
                          <p className="text-xs text-textMuted">/mes</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleActivateModule(mod.moduleId)}
                          disabled={!!isChangingModule}
                          className={`${btnPrimary} text-xs py-1.5 px-3 disabled:opacity-50`}
                        >
                          <IoAddCircleOutline className="w-4 h-4" />
                          {isChangingModule === mod.moduleId ? 'Activando...' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {subscriptionNeedsPayment(subscription) && (
            <div className="mt-5 pt-5 border-t border-borderBase">
              <button type="button" onClick={handleCreateSubscription} className={`${btnPrimary} w-full justify-center`}>
                <IoCardOutline className="w-4 h-4" />
                Activar suscripción con Mercado Pago
              </button>
            </div>
          )}
        </div>

        {paymentHistory?.length > 0 && (
          <div className={`${card} p-5 sm:p-6`}>
            <h2 className="text-lg font-semibold text-textPrimary mb-4 flex items-center gap-2">
              <IoReceiptOutline className="w-5 h-5 text-brand-light" />
              Historial de pagos
            </h2>
            <div className={tableWrap}>
              <table className="w-full text-sm">
                <thead>
                  <tr className={tableHeadRow}>
                    <th className={tableTh}>Fecha</th>
                    <th className={tableTh}>Concepto</th>
                    <th className={tableTh}>Monto</th>
                    <th className={tableTh}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={index} className={tableRow}>
                      <td className="px-4 py-3 text-textSecondary">{formatDate(payment.date)}</td>
                      <td className="px-4 py-3 text-textPrimary">{payment.description}</td>
                      <td className="px-4 py-3 text-textPrimary font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-brand-muted text-brand-light border border-borderStrong">
                          Pagado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionManager;
