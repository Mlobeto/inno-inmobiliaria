import  { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '@shared/redux';
import { 
  IoCheckmarkCircleOutline, 
  IoRocketSharp,
  IoHomeSharp,
  IoTimeSharp 
} from 'react-icons/io5';

/**
 * Página de éxito después del pago en MercadoPago
 * Muestra confirmación y detalles de la suscripción
 */
const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const { 
    data: subscriptionData, 
    isLoading,
    refetch 
  } = useGetCurrentSubscriptionQuery();

  const subscription = subscriptionData?.subscription;

  // Obtener parámetros de la URL (MercadoPago envía datos en el callback)
  // eslint-disable-next-line no-unused-vars
  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  // eslint-disable-next-line no-unused-vars
  const externalReference = searchParams.get('external_reference');

  // Refetch para asegurarse de tener la última info
  useEffect(() => {
    refetch();
  }, [refetch]);

  // Countdown para redirección automática
  useEffect(() => {
    if (countdown === 0) {
      navigate('/dashboard');
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando tu suscripción...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Tarjeta de éxito */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header con ícono de éxito */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <IoCheckmarkCircleOutline className="text-green-500 text-5xl" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ¡Pago Exitoso!
            </h1>
            <p className="text-green-100">
              Tu suscripción ha sido activada correctamente
            </p>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {/* Información de la suscripción */}
            {subscription && (
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Detalles de tu Suscripción
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold text-gray-800">
                      {subscription.Plan?.name}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-semibold text-gray-800">
                      {subscription.Plan?.currency} {parseFloat(subscription.Plan?.priceMonthly).toLocaleString('es-AR')}/mes
                    </span>
                  </div>

                  {subscription.status === 'trialing' && subscription.trialEnd && (
                    <div className="flex justify-between items-center bg-blue-50 -mx-2 px-2 py-2 rounded">
                      <span className="text-blue-700 flex items-center">
                        <IoTimeSharp className="mr-2" />
                        Período de prueba hasta:
                      </span>
                      <span className="font-semibold text-blue-800">
                        {new Date(subscription.trialEnd).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Próximo pago:</span>
                    <span className="font-semibold text-gray-800">
                      {subscription.currentPeriodEnd 
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')
                        : 'N/A'}
                    </span>
                  </div>

                  {paymentId && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">ID de Pago:</span>
                      <span className="text-gray-600 font-mono">
                        {paymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Características desbloqueadas */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                ✨ Características Desbloqueadas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center text-gray-700">
                  <IoHomeSharp className="text-indigo-600 mr-2" />
                  <span className="text-sm">{subscription?.Plan?.maxProperties} propiedades</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <IoCheckmarkCircleOutline className="text-green-600 mr-2" />
                  <span className="text-sm">{subscription?.Plan?.maxClients} clientes</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <IoCheckmarkCircleOutline className="text-green-600 mr-2" />
                  <span className="text-sm">{subscription?.Plan?.maxUsers} usuarios</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <IoCheckmarkCircleOutline className="text-green-600 mr-2" />
                  <span className="text-sm">{subscription?.Plan?.maxStorageGB} GB storage</span>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-indigo-800">
                <strong>¿Qué sigue?</strong> Serás redirigido automáticamente a tu dashboard 
                donde podrás comenzar a usar todas las características de tu plan.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center font-semibold"
              >
                <IoRocketSharp className="mr-2" />
                Ir al Dashboard
              </button>

              <button
                onClick={() => navigate('/subscription')}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
              >
                Ver Mi Suscripción
              </button>
            </div>

            {/* Countdown */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Redirigiendo en {countdown} segundos...
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600">
          <p className="text-sm">
            ¿Necesitas ayuda? {' '}
            <a href="/contact" className="text-indigo-600 hover:underline">
              Contáctanos
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
