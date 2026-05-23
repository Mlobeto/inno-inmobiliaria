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

const PLAN_COLORS = {
  basic: { border: 'border-borderBase', active: 'border-brand ring-1 ring-brand/30' },
  professional: { border: 'border-brand/40', active: 'border-brand ring-2 ring-brand/40' },
  gestpro: { border: 'border-borderStrong', active: 'border-brand-light ring-2 ring-brand/50' },
};

const COMPARE_ROWS = [
  { label: 'Propiedades', key: 'maxProperties', render: (v) => (v === -1 ? 'Ilimitadas' : v) },
  { label: 'Clientes', key: 'maxClients', render: (v) => (v === -1 ? 'Ilimitados' : v) },
  { label: 'Usuarios', key: 'maxUsers', render: (v) => v },
  { label: 'Almacenamiento', key: 'maxStorageGB', render: (v) => `${v} GB` },
  { label: 'Landing Page', key: 'landingPage', render: (v) => v },
  { label: 'Portal inquilinos', key: 'portalInquilino', render: (v) => v },
  { label: 'MercadoLibre', key: 'mercadoLibreIntegration', render: (v) => v },
  { label: 'WhatsApp', key: 'whatsappIntegration', render: (v) => v },
  { label: 'CRM Leads', key: 'leads', render: (v) => v },
  { label: 'Agentes & Comisiones', key: 'agentRole', render: (v) => v },
  { label: 'Facturación ARCA', key: 'electronicInvoicing', render: (v) => v },
  { label: 'Gestión Loteos', key: 'loteos', render: (v) => v },
  { label: 'Dominio propio', key: 'customDomain', render: (v) => v },
  { label: 'Soporte prioritario', key: 'prioritySupport', render: (v) => v },
];

const FEATURE_FLAGS = [
  { key: 'landingPage', label: 'Landing Page', icon: IoGlobeOutline },
  { key: 'portalInquilino', label: 'Portal inquilinos', icon: IoKeyOutline },
  { key: 'mercadoLibreIntegration', label: 'MercadoLibre', icon: IoStorefrontOutline },
  { key: 'leads', label: 'CRM Leads', icon: IoFunnelOutline },
  { key: 'agentRole', label: 'Agentes & Comisiones', icon: IoPeopleCircleOutline },
  { key: 'electronicInvoicing', label: 'Facturación ARCA', icon: null },
  { key: 'loteos', label: 'Gestión Loteos', icon: IoMapOutline },
  { key: 'customDomain', label: 'Dominio propio', icon: IoGlobeOutline },
  { key: 'prioritySupport', label: 'Soporte prioritario', icon: null },
  { key: 'whatsappIntegration', label: 'WhatsApp', icon: null },
  { key: 'exportData', label: 'Exportación de datos', icon: null },
  { key: 'estadisticas', label: 'Estadísticas avanzadas', icon: null },
];

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

function PlanFeaturesList({ features, compact = false }) {
  const f = features || {};
  return (
    <ul className={`space-y-1.5 ${compact ? 'text-xs' : 'text-sm'}`}>
      {COMPARE_ROWS.map((row) => {
        const raw = f[row.key];
        if (raw === undefined || raw === null) return null;
        const rendered = row.render(raw);
        const isBool = typeof rendered === 'boolean';
        const included = isBool ? rendered : true;
        return (
          <li
            key={row.key}
            className={`flex items-center gap-2 ${included ? 'text-textSecondary' : 'text-textMuted'}`}
          >
            {isBool ? (
              included ? (
                <IoCheckmarkCircle className="w-4 h-4 text-brand-light shrink-0" />
              ) : (
                <IoCloseCircle className="w-4 h-4 text-textMuted shrink-0 opacity-60" />
              )
            ) : (
              <IoCheckmarkCircle className="w-4 h-4 text-brand-light shrink-0" />
            )}
            <span className={included ? '' : 'line-through opacity-50'}>
              {row.label}
              {!isBool && `: ${rendered}`}
            </span>
          </li>
        );
      })}
      {FEATURE_FLAGS.map(({ key, label, icon: Icon }) => {
        const val = f[key];
        if (val === undefined) return null;
        if (COMPARE_ROWS.some((r) => r.key === key)) return null;
        return (
          <li
            key={key}
            className={`flex items-center gap-2 ${val ? 'text-textSecondary' : 'text-textMuted'}`}
          >
            {val ? (
              <IoCheckmarkCircle className="w-4 h-4 text-brand-light shrink-0" />
            ) : (
              <IoCloseCircle className="w-4 h-4 text-textMuted shrink-0 opacity-60" />
            )}
            {Icon && <Icon className={`w-3.5 h-3.5 shrink-0 ${val ? 'text-brand-light' : 'text-textMuted'}`} />}
            <span className={val ? '' : 'line-through opacity-50'}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}

PlanFeaturesList.propTypes = {
  features: PropTypes.object,
  compact: PropTypes.bool,
};

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const subResponse = await axios.get(`${API_URL}/subscriptions/current`, { headers });
      setSubscription(subResponse.data?.subscription || null);

      const plansResponse = await axios.get(`${API_URL}/plans`, { headers });
      setPlans(plansResponse.data?.plans || []);

      try {
        const paymentsResponse = await axios.get(`${API_URL}/subscriptions/payment-history`, { headers });
        setPaymentHistory(paymentsResponse.data?.payments || []);
      } catch {
        /* historial opcional */
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar datos de suscripción:', error);
      toast.error('Error al cargar información de la suscripción');
      setIsLoading(false);
    }
  };

  const handleCreateSubscription = async (planId) => {
    const needsPayment = subscriptionNeedsPayment(subscription);
    const confirmMsg = needsPayment
      ? 'Vas a Mercado Pago para activar la suscripción.\n\n' +
        '• El período de prueba ya lo usaste: el primer cobro es al confirmar (o en el próximo ciclo según MP).\n' +
        '• Las suscripciones se debitan con tarjeta de crédito o débito.\n\n' +
        '¿Continuar?'
      : '¿Querés suscribirte a este plan?';
    if (!window.confirm(confirmMsg)) return;
    setIsChangingPlan(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/subscriptions/create-subscription`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      window.location.href = response.data.subscriptionUrl;
    } catch (error) {
      const data = error.response?.data;
      const prefix = data?.code ? `[${data.code}] ` : '';
      const hint = typeof data?.hint === 'string' ? ` ${data.hint}` : '';
      toast.error(`${prefix}${data?.error || error.message || 'Error al crear la suscripción'}${hint}`, {
        autoClose: 12000,
      });
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleChangePlan = async (newPlanId) => {
    if (!window.confirm('¿Estás seguro de cambiar tu plan de suscripción?')) return;

    setIsChangingPlan(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/subscriptions/change-plan`,
        { newPlanId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success('Plan actualizado exitosamente');
      await loadSubscriptionData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Error al cambiar plan');
    } finally {
      setIsChangingPlan(false);
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
                    else if (subscription?.planId) handleCreateSubscription(subscription.planId);
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
              Plan actual
            </h2>
            {getStatusBadge(subscription?.status)}
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className={statCard}>
              <p className="text-xs text-textMuted mb-0.5">Plan</p>
              <p className="text-lg font-bold text-textPrimary">{subscription?.Plan?.name || 'N/A'}</p>
              <p className="text-sm text-textSecondary mt-1">
                {formatCurrency(parseFloat(subscription?.Plan?.priceMonthly || 0))}/mes
              </p>
            </div>
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
              <p className="text-xs text-textMuted mb-0.5">Fecha de inicio</p>
              <p className="text-sm font-semibold text-textPrimary">{formatDate(subscription?.currentPeriodStart)}</p>
            </div>
          </div>

          {subscription?.Plan?.features && (
            <div className="pt-5 border-t border-borderBase">
              <h3 className="text-sm font-semibold text-textPrimary mb-3">Características incluidas</h3>
              <PlanFeaturesList features={subscription.Plan.features} />
            </div>
          )}
        </div>

        <div id="available-plans" className={`${card} p-5 sm:p-6 mb-6 scroll-mt-4`}>
          <h2 className="text-lg font-semibold text-textPrimary mb-5 flex items-center gap-2">
            <IoLayersOutline className="w-5 h-5 text-brand-light" />
            {subscriptionNeedsPayment(subscription) ? 'Renovar o elegir plan' : 'Cambiar plan'}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans
              .filter((plan) => plan.isActive && plan.planId !== 'lifetime')
              .map((plan) => {
                const isCurrentPlan = subscription?.planId === plan.planId;
                const needsPayment = subscriptionNeedsPayment(subscription);
                const isDisabled = isChangingPlan || (isCurrentPlan && !needsPayment);
                const colors = PLAN_COLORS[plan.planId] || PLAN_COLORS.basic;
                const features = plan.features || {};

                let buttonLabel = 'Suscribirse';
                if (isCurrentPlan) {
                  buttonLabel = needsPayment ? 'Pagar y reactivar' : 'Plan actual';
                } else if (subscription && !needsPayment) {
                  buttonLabel = 'Cambiar a este plan';
                }

                return (
                  <div
                    key={plan.planId}
                    className={`rounded-xl border bg-bgElevated/40 p-4 flex flex-col transition-colors ${
                      isCurrentPlan ? colors.active : `${colors.border} hover:border-borderStrong`
                    }`}
                  >
                    <div className="mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-textPrimary">{plan.name}</h3>
                        {plan.isPopular && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-light bg-brand-muted px-2 py-0.5 rounded-full border border-borderStrong">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-textMuted mt-1 min-h-[2rem]">{plan.description}</p>
                    </div>

                    <p className="text-2xl font-bold text-textPrimary mb-3">
                      {formatCurrency(parseFloat(plan.priceMonthly || 0))}
                      <span className="text-sm text-textMuted font-normal">/mes</span>
                    </p>

                    <div className="grid grid-cols-2 gap-2 mb-4 text-center text-xs">
                      <div className="rounded-lg bg-bgSurface border border-borderBase px-2 py-1.5">
                        <div className="font-bold text-textPrimary">
                          {features.maxProperties === -1 ? '∞' : features.maxProperties ?? '—'}
                        </div>
                        <div className="text-textMuted">Propiedades</div>
                      </div>
                      <div className="rounded-lg bg-bgSurface border border-borderBase px-2 py-1.5">
                        <div className="font-bold text-textPrimary">
                          {features.maxClients === -1 ? '∞' : features.maxClients ?? '—'}
                        </div>
                        <div className="text-textMuted">Clientes</div>
                      </div>
                    </div>

                    <div className="flex-1 mb-4">
                      <PlanFeaturesList features={features} compact />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (needsPayment || !subscription) {
                          handleCreateSubscription(plan.planId);
                        } else {
                          handleChangePlan(plan.planId);
                        }
                      }}
                      disabled={isDisabled}
                      className={
                        isDisabled
                          ? `${btnSecondary} w-full justify-center opacity-60 cursor-not-allowed`
                          : needsPayment && isCurrentPlan
                            ? 'w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-customRed hover:bg-customRedDark text-textWhite text-sm font-semibold rounded-lg transition-colors disabled:opacity-50'
                            : `${btnPrimary} w-full justify-center`
                      }
                    >
                      {isChangingPlan ? 'Procesando...' : buttonLabel}
                    </button>
                  </div>
                );
              })}
          </div>
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
