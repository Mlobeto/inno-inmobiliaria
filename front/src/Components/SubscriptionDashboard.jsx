import  { useState } from 'react';
import { 
  useGetCurrentSubscriptionQuery, 
  useGetPlansQuery,
  useCancelSubscriptionMutation,
  useChangePlanMutation 
} from '@shared/redux';
import { 
  IoCheckmarkCircle, 
  IoCloseCircle, 
  IoWarning,
  IoCard,
  IoCalendar,
  IoTrendingUp,
  IoAlertCircle 
} from 'react-icons/io5';

/**
 * Dashboard de Suscripción
 * Muestra la suscripción activa, permite cancelar y cambiar de plan
 */
const SubscriptionDashboard = () => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const { 
    data: subscriptionData, 
    isLoading: loadingSubscription,
    refetch: refetchSubscription 
  } = useGetCurrentSubscriptionQuery();

  const { 
    data: plansData, 
    isLoading: loadingPlans 
  } = useGetPlansQuery();

  const [cancelSubscription, { isLoading: canceling }] = useCancelSubscriptionMutation();
  const [changePlan, { isLoading: changingPlan }] = useChangePlanMutation();

  const subscription = subscriptionData?.subscription;
  const plans = plansData?.plans || [];

  // Handlers
  const handleCancelSubscription = async (immediately = false) => {
    try {
      const result = await cancelSubscription({ immediately }).unwrap();
      alert(result.message);
      setShowCancelModal(false);
      refetchSubscription();
    } catch (error) {
      console.error('Error cancelando suscripción:', error);
      alert(error?.data?.error || 'Error al cancelar la suscripción');
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlan) return;

    try {
      const result = await changePlan({ 
        newPlanId: selectedPlan.planId,
        billingCycle: 'monthly' 
      }).unwrap();
      alert(result.message);
      setShowChangePlanModal(false);
      setSelectedPlan(null);
      refetchSubscription();
    } catch (error) {
      console.error('Error cambiando plan:', error);
      alert(error?.data?.error || 'Error al cambiar el plan');
    }
  };

  // Estados de carga
  if (loadingSubscription || loadingPlans) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Sin suscripción
  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <IoWarning className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            No tienes una suscripción activa
          </h2>
          <p className="text-gray-600 mb-6">
            Para utilizar GestiónProp necesitas seleccionar un plan
          </p>
          <a 
            href="/#planes" 
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            Ver Planes Disponibles
          </a>
        </div>
      </div>
    );
  }

  const plan = subscription.Plan;
  const isTrialing = subscription.status === 'trialing';
  const isActive = subscription.status === 'active';
  const isPastDue = subscription.status === 'past_due';

  // Calcular días restantes del trial
  let trialDaysLeft = 0;
  if (isTrialing && subscription.trialEnd) {
    const now = new Date();
    const trialEnd = new Date(subscription.trialEnd);
    trialDaysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Mi Suscripción</h1>

      {/* Estado de la suscripción */}
      {isTrialing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
          <IoAlertCircle className="text-blue-500 text-2xl mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-800">Período de Prueba Activo</h3>
            <p className="text-blue-600">
              Te quedan {trialDaysLeft} días de prueba gratuita. 
              Después necesitarás seleccionar un método de pago.
            </p>
          </div>
        </div>
      )}

      {isPastDue && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start">
          <IoWarning className="text-red-500 text-2xl mr-3 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-red-800">Pago Vencido</h3>
            <p className="text-red-600">
              Tu suscripción está vencida. Por favor actualiza tu método de pago.
            </p>
          </div>
        </div>
      )}

      {/* Tarjeta del plan actual */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{plan?.name}</h2>
            <p className="text-gray-600">{plan?.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-indigo-600">
              {plan?.currency} {parseFloat(plan?.priceMonthly).toLocaleString('es-AR')}
            </div>
            <div className="text-gray-500 text-sm">por mes</div>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center mb-6">
          {isActive && (
            <>
              <IoCheckmarkCircle className="text-green-500 text-xl mr-2" />
              <span className="text-green-600 font-semibold">Activa</span>
            </>
          )}
          {isTrialing && (
            <>
              <IoCalendar className="text-blue-500 text-xl mr-2" />
              <span className="text-blue-600 font-semibold">En Período de Prueba</span>
            </>
          )}
          {isPastDue && (
            <>
              <IoCloseCircle className="text-red-500 text-xl mr-2" />
              <span className="text-red-600 font-semibold">Vencida</span>
            </>
          )}
        </div>

        {/* Características del plan */}
        <div className="grid md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
          <div className="flex items-center">
            <IoCheckmarkCircle className="text-green-500 mr-2" />
            <span>{plan?.maxProperties} propiedades</span>
          </div>
          <div className="flex items-center">
            <IoCheckmarkCircle className="text-green-500 mr-2" />
            <span>{plan?.maxClients} clientes</span>
          </div>
          <div className="flex items-center">
            <IoCheckmarkCircle className="text-green-500 mr-2" />
            <span>{plan?.maxUsers} usuarios</span>
          </div>
          <div className="flex items-center">
            <IoCheckmarkCircle className="text-green-500 mr-2" />
            <span>{plan?.maxStorageGB} GB de almacenamiento</span>
          </div>
        </div>

        {/* Información de pago */}
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <div className="flex items-center mb-2">
              <IoCard className="mr-2" />
              <span className="font-semibold">Método de pago:</span>
            </div>
            <div className="ml-6">
              {subscription.paymentProvider === 'mercadopago' ? 'MercadoPago' : 'Manual'}
            </div>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <IoCalendar className="mr-2" />
              <span className="font-semibold">Próximo pago:</span>
            </div>
            <div className="ml-6">
              {subscription.currentPeriodEnd 
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-4">
        <button
          onClick={() => setShowChangePlanModal(true)}
          className="flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          <IoTrendingUp className="mr-2" />
          Cambiar Plan
        </button>
        <button
          onClick={() => setShowCancelModal(true)}
          className="flex items-center justify-center bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
        >
          <IoCloseCircle className="mr-2" />
          Cancelar Suscripción
        </button>
      </div>

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cancelar Suscripción
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas cancelar tu suscripción?
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleCancelSubscription(false)}
                disabled={canceling}
                className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
              >
                {canceling ? 'Cancelando...' : 'Cancelar al final del período'}
              </button>
              <button
                onClick={() => handleCancelSubscription(true)}
                disabled={canceling}
                className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {canceling ? 'Cancelando...' : 'Cancelar inmediatamente'}
              </button>
            </div>

            <button
              onClick={() => setShowCancelModal(false)}
              className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Volver
            </button>
          </div>
        </div>
      )}

      {/* Modal de cambio de plan */}
      {showChangePlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-6 my-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Cambiar Plan
            </h3>
            <p className="text-gray-600 mb-6">
              Selecciona el nuevo plan al que deseas cambiar:
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {plans
                .filter(p => p.planId !== plan?.planId)
                .map(p => (
                  <div
                    key={p.planId}
                    onClick={() => setSelectedPlan(p)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                      selectedPlan?.planId === p.planId
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    <h4 className="font-bold text-lg mb-2">{p.name}</h4>
                    <div className="text-2xl font-bold text-indigo-600 mb-2">
                      {p.currency} {parseFloat(p.priceMonthly).toLocaleString('es-AR')}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>✓ {p.maxProperties} propiedades</div>
                      <div>✓ {p.maxClients} clientes</div>
                      <div>✓ {p.maxUsers} usuarios</div>
                      <div>✓ {p.maxStorageGB} GB storage</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleChangePlan}
                disabled={!selectedPlan || changingPlan}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPlan ? 'Cambiando...' : 'Confirmar Cambio'}
              </button>
              <button
                onClick={() => {
                  setShowChangePlanModal(false);
                  setSelectedPlan(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDashboard;
