import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetCurrentSubscriptionQuery } from '@shared/redux';
import {
  IoCheckmarkCircleOutline,
  IoRocketSharp,
  IoHomeSharp,
  IoTimeSharp,
} from 'react-icons/io5';
import {
  panelShell,
  card,
  btnPrimary,
  btnSecondary,
  spinner,
  alertSuccess,
  statCard,
} from './Admin/adminPanelTheme';

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
    refetch,
  } = useGetCurrentSubscriptionQuery();

  const subscription = subscriptionData?.subscription;

  // eslint-disable-next-line no-unused-vars
  const status = searchParams.get('status');
  const paymentId = searchParams.get('payment_id');
  // eslint-disable-next-line no-unused-vars
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    refetch();
  }, [refetch]);

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
      <div className={`${panelShell} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-14 h-14 mx-auto mb-4 ${spinner}`} />
          <p className="text-textSecondary">Verificando tu suscripción...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: IoHomeSharp, label: `${subscription?.Plan?.maxProperties ?? '—'} propiedades` },
    { icon: IoCheckmarkCircleOutline, label: `${subscription?.Plan?.maxClients ?? '—'} clientes` },
    { icon: IoCheckmarkCircleOutline, label: `${subscription?.Plan?.maxUsers ?? '—'} usuarios` },
    { icon: IoCheckmarkCircleOutline, label: `${subscription?.Plan?.maxStorageGB ?? '—'} GB storage` },
  ];

  return (
    <div className={`${panelShell} flex items-center justify-center p-4`}>
      <div className="max-w-lg w-full">
        <div className={`${card} overflow-hidden shadow-brandGlow`}>
          <div className="bg-brand-subtle/50 border-b border-borderBase px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-muted rounded-full mb-4 border border-borderStrong">
              <IoCheckmarkCircleOutline className="text-brand-light text-4xl" />
            </div>
            <h1 className="text-2xl font-bold text-textPrimary mb-1">¡Pago exitoso!</h1>
            <p className="text-textSecondary text-sm">
              Tu suscripción fue activada correctamente
            </p>
          </div>

          <div className="p-6 space-y-5">
            {subscription && (
              <div className={`${statCard} space-y-3`}>
                <h2 className="text-base font-semibold text-textPrimary">Detalles de tu suscripción</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-textMuted">Plan</span>
                    <span className="font-medium text-textPrimary">{subscription.Plan?.name}</span>
                  </div>

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-textMuted">Monto</span>
                    <span className="font-medium text-brand-light">
                      {subscription.Plan?.currency}{' '}
                      {parseFloat(subscription.Plan?.priceMonthly).toLocaleString('es-AR')}/mes
                    </span>
                  </div>

                  {subscription.status === 'trialing' && subscription.trialEnd && (
                    <div className="flex justify-between items-center gap-2 rounded-lg bg-customYellowMuted border border-customYellow/30 px-3 py-2">
                      <span className="text-customYellow flex items-center gap-1.5 text-xs">
                        <IoTimeSharp className="shrink-0" />
                        Prueba hasta
                      </span>
                      <span className="font-medium text-customYellow text-xs">
                        {new Date(subscription.trialEnd).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center gap-4">
                    <span className="text-textMuted">Próximo pago</span>
                    <span className="font-medium text-textPrimary">
                      {subscription.currentPeriodEnd
                        ? new Date(subscription.currentPeriodEnd).toLocaleDateString('es-AR')
                        : 'N/A'}
                    </span>
                  </div>

                  {paymentId && (
                    <div className="flex justify-between items-center gap-4 pt-1 border-t border-borderBase">
                      <span className="text-textMuted text-xs">ID de pago</span>
                      <span className="text-textSecondary font-mono text-xs truncate max-w-[180px]">
                        {paymentId}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-semibold text-textPrimary mb-3">Características desbloqueadas</h3>
              <div className="grid grid-cols-2 gap-2">
                {features.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-lg border border-borderBase bg-bgElevated px-3 py-2 text-textSecondary text-xs"
                  >
                    <Icon className="text-brand-light shrink-0 w-4 h-4" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${alertSuccess} py-3`}>
              <p className="text-sm">
                <strong className="text-brand-light">¿Qué sigue?</strong> Serás redirigido al dashboard
                para empezar a usar tu plan.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`${btnPrimary} w-full justify-center py-2.5`}
              >
                <IoRocketSharp />
                Ir al dashboard
              </button>

              <button
                type="button"
                onClick={() => navigate('/subscription')}
                className={`${btnSecondary} w-full justify-center py-2.5`}
              >
                Ver mi suscripción
              </button>
            </div>

            <p className="text-center text-xs text-textMuted">
              Redirigiendo en {countdown} segundos...
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-textMuted mt-5">
          ¿Necesitás ayuda?{' '}
          <a href="/contact" className="text-brand-light hover:text-textPrimary transition-colors">
            Contactanos
          </a>
        </p>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
