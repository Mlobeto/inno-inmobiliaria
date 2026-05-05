import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  IoCardOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoTimeOutline,
  IoRocketOutline,
  IoArrowBackOutline,
  IoCheckmarkOutline,
  IoInformationCircleOutline,
  IoWarningOutline,
  IoReceiptOutline
} from 'react-icons/io5';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Cargar suscripción actual
      const subResponse = await axios.get(`${API_URL}/subscriptions/current`, { headers });
      console.log('📊 Respuesta de suscripción:', subResponse.data);
      console.log('📊 Subscription:', subResponse.data?.subscription);
      console.log('📊 Plan en subscription:', subResponse.data?.subscription?.Plan);
      setSubscription(subResponse.data?.subscription || null);

      // Cargar planes disponibles
      const plansResponse = await axios.get(`${API_URL}/plans`, { headers });
      console.log('📋 Respuesta de planes:', plansResponse.data);
      console.log('📋 Planes array:', plansResponse.data?.plans);
      setPlans(plansResponse.data?.plans || []);

      // Cargar historial de pagos
      try {
        const paymentsResponse = await axios.get(`${API_URL}/subscriptions/payment-history`, { headers });
        setPaymentHistory(paymentsResponse.data?.payments || []);
      } catch (error) {
        console.log('No se pudo cargar historial de pagos:', error);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error al cargar datos de suscripción:', error);
      toast.error('Error al cargar información de la suscripción');
      setIsLoading(false);
    }
  };

  const handleCreateSubscription = async (planId) => {
    if (!window.confirm('¿Querés suscribirte a este plan?')) return;
    setIsChangingPlan(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/subscriptions/create-subscription`,
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Redirigir a MercadoPago para completar el pago
      window.location.href = response.data.subscriptionUrl;
    } catch (error) {
      console.error('Error al crear suscripción:', error);
      toast.error(error.response?.data?.error || 'Error al crear la suscripción');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleChangePlan = async (newPlanId) => {
    if (!window.confirm('¿Estás seguro de cambiar tu plan de suscripción?')) {
      return;
    }

    setIsChangingPlan(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/subscriptions/change-plan`,
        { newPlanId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Plan actualizado exitosamente');
      setSelectedPlan(null);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error al cambiar plan:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800 border-green-300', icon: IoCheckmarkCircleOutline, text: 'Activo' },
      trialing: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: IoTimeOutline, text: 'Periodo de Prueba' },
      trial: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: IoTimeOutline, text: 'Periodo de Prueba' },
      past_due: { color: 'bg-red-100 text-red-800 border-red-300', icon: IoCloseCircleOutline, text: 'Vencido' },
      canceled: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: IoCloseCircleOutline, text: 'Cancelado' },
      incomplete: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: IoWarningOutline, text: 'Incompleto' }
    };

    const normalizedStatus = status?.toLowerCase() || '';
    const badge = badges[normalizedStatus] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: IoInformationCircleOutline, text: status || 'Desconocido' };
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/20 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-white/10 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/panel')}
              className="text-white/70 hover:text-white flex items-center space-x-2 mb-4 transition-colors"
            >
              <IoArrowBackOutline className="w-5 h-5" />
              <span>Volver al Panel</span>
            </button>
            <h1 className="text-4xl font-bold text-white flex items-center space-x-3">
              <IoCardOutline className="w-10 h-10" />
              <span>Mi Suscripción</span>
            </h1>
          </div>
        </div>

        {/* Alerta de suscripción expirada / vencida */}
        {(() => {
          const statusNorm = subscription?.status?.toLowerCase() || '';
          const isVencida = isExpired || ['past_due', 'canceled', 'incomplete'].includes(statusNorm);
          if (!isVencida) return null;
          const isPastDue = statusNorm === 'past_due';
          const isCanceled = statusNorm === 'canceled';
          const title = isPastDue
            ? '⚠️ Tu suscripción está vencida'
            : isCanceled
            ? '⚠️ Tu suscripción fue cancelada'
            : '⚠️ Tu período de prueba ha expirado';
          const message = isPastDue
            ? 'Tu suscripción venció y el acceso a la plataforma está restringido. Realizá el pago para reactivar tu cuenta y seguir gestionando tu inmobiliaria sin interrupciones.'
            : isCanceled
            ? 'Tu suscripción fue cancelada. Para volver a usar la plataforma, contratá un plan y completá el pago a través de Mercado Pago.'
            : 'Tu período de prueba ha expirado. Para continuar usando la plataforma, seleccioná un plan y completá el pago a través de Mercado Pago.';
          return (
            <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-6 mb-8 shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="bg-red-500/30 rounded-full p-3 flex-shrink-0">
                  <IoWarningOutline className="w-8 h-8 text-red-300" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                  <p className="text-white/90 mb-5 leading-relaxed">{message}</p>
                  <button
                    onClick={() => {
                      const element = document.getElementById('available-plans');
                      element?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-colors shadow-lg text-base"
                  >
                    💳 Contratar plan ahora
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Banner de Periodo de Prueba */}
        {subscription?.status === 'trialing' && (() => {
          const now = new Date();
          const trialEnd = new Date(subscription.trialEnd);
          const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
          
          return (
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-400 rounded-2xl p-6 mb-8 shadow-xl">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-500/30 backdrop-blur-sm rounded-full p-3">
                  <IoTimeOutline className="text-blue-200 text-3xl flex-shrink-0" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    🎉 Período de Prueba Activo
                  </h3>
                  <p className="text-blue-100 text-base mb-3">
                    Estás probando el <strong>{subscription.Plan?.name}</strong> de forma gratuita.
                  </p>
                  <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-200 mb-1">📅 Tiempo restante:</p>
                        <p className="text-3xl font-bold text-white">
                          {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-200 mb-1">Finaliza el:</p>
                        <p className="text-lg font-semibold text-white">
                          {formatDate(subscription.trialEnd)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-blue-200">
                    💡 Después del periodo de prueba, necesitarás seleccionar un método de pago para continuar usando InnoInmobiliaria.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Suscripción Actual */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
              <IoRocketOutline className="w-6 h-6" />
              <span>Plan Actual</span>
            </h2>
            {getStatusBadge(subscription?.status)}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Plan</p>
              <p className="text-white text-2xl font-bold">{subscription?.Plan?.name || 'N/A'}</p>
              <p className="text-white/80 text-sm mt-2">{formatCurrency(parseFloat(subscription?.Plan?.priceMonthly || 0))}/mes</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">
                {subscription?.status === 'trialing' ? 'Trial termina' : 'Próxima renovación'}
              </p>
              <p className="text-white text-lg font-semibold">
                {subscription?.status === 'trialing' 
                  ? formatDate(subscription?.trialEnd)
                  : formatDate(subscription?.currentPeriodEnd)
                }
              </p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white/60 text-sm mb-1">Fecha de inicio</p>
              <p className="text-white text-lg font-semibold">{formatDate(subscription?.currentPeriodStart)}</p>
            </div>
          </div>

          {/* Características del plan */}
          {subscription?.Plan && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-white font-semibold mb-3">Características incluidas:</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2 text-white/80">
                  <IoCheckmarkOutline className="w-5 h-5 text-green-400" />
                  <span>{subscription.Plan.features?.maxUsers === -1 ? 'Usuarios ilimitados' : `Hasta ${subscription.Plan.features?.maxUsers} usuarios`}</span>
                </div>
                <div className="flex items-center space-x-2 text-white/80">
                  <IoCheckmarkOutline className="w-5 h-5 text-green-400" />
                  <span>{subscription.Plan.features?.maxProperties === -1 ? 'Propiedades ilimitadas' : `Hasta ${subscription.Plan.features?.maxProperties} propiedades`}</span>
                </div>
                {subscription.Plan.features?.whatsappIntegration && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <IoCheckmarkOutline className="w-5 h-5 text-green-400" />
                    <span>Integración WhatsApp</span>
                  </div>
                )}
                {subscription.Plan.features?.customDomain && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <IoCheckmarkOutline className="w-5 h-5 text-green-400" />
                    <span>Subdominio personalizado</span>
                  </div>
                )}
                {subscription.Plan.features?.landingPage && (
                  <div className="flex items-center space-x-2 text-white/80">
                    <IoCheckmarkOutline className="w-5 h-5 text-green-400" />
                    <span>Landing page pública</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Planes disponibles */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
            <IoRocketOutline className="w-6 h-6" />
            <span>Cambiar Plan</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.filter(plan => plan.isActive && plan.planId !== 'lifetime').map((plan) => (
              <div
                key={plan.planId}
                className={`bg-white/5 rounded-xl p-6 border transition-all ${
                  subscription?.planId === plan.planId
                    ? 'border-blue-400 bg-blue-500/10'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                <p className="text-3xl font-bold text-white mb-4">
                  {formatCurrency(parseFloat(plan.priceMonthly || 0))}
                  <span className="text-sm text-white/60 font-normal">/mes</span>
                </p>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center space-x-2 text-white/80 text-sm">
                    <IoCheckmarkOutline className="w-4 h-4 text-green-400" />
                    <span>{plan.features?.maxUsers === -1 ? 'Usuarios ilimitados' : `${plan.features?.maxUsers} usuarios`}</span>
                  </li>
                  <li className="flex items-center space-x-2 text-white/80 text-sm">
                    <IoCheckmarkOutline className="w-4 h-4 text-green-400" />
                    <span>{plan.features?.maxProperties === -1 ? 'Propiedades ilimitadas' : `${plan.features?.maxProperties} propiedades`}</span>
                  </li>
                  {plan.features?.landingPage && (
                    <li className="flex items-center space-x-2 text-white/80 text-sm">
                      <IoCheckmarkOutline className="w-4 h-4 text-green-400" />
                      <span>Landing page</span>
                    </li>
                  )}
                </ul>

                <button
                  onClick={() => {
                    const noActiveSub = !subscription || ['incomplete', 'canceled', 'past_due'].includes(subscription?.status);
                    if (noActiveSub) {
                      handleCreateSubscription(plan.planId);
                    } else {
                      handleChangePlan(plan.planId);
                    }
                  }}
                  disabled={subscription?.planId === plan.planId || isChangingPlan}
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-all ${
                    subscription?.planId === plan.planId
                      ? 'bg-gray-500 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {subscription?.planId === plan.planId
                    ? 'Plan Actual'
                    : (!subscription || ['incomplete', 'canceled', 'past_due'].includes(subscription?.status))
                      ? 'Suscribirse'
                      : 'Cambiar a este plan'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Historial de pagos */}
        {paymentHistory && paymentHistory.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <IoReceiptOutline className="w-6 h-6" />
              <span>Historial de Pagos</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-white/60 text-sm border-b border-white/10">
                    <th className="pb-3">Fecha</th>
                    <th className="pb-3">Concepto</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((payment, index) => (
                    <tr key={index} className="text-white border-b border-white/5">
                      <td className="py-3">{formatDate(payment.date)}</td>
                      <td className="py-3">{payment.description}</td>
                      <td className="py-3">{formatCurrency(payment.amount)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
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
