/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Guard que verifica el estado de la suscripción
 * Redirige a /subscription si la suscripción está expirada o cancelada
 */
const SubscriptionGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    checkSubscription();
  }, [location.pathname]);

  const checkSubscription = async () => {
    try {
      // Si ya está en subscription, no verificar
      if (location.pathname.includes('subscription')) {
        setIsChecking(false);
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setIsChecking(false);
        return;
      }

      // Verificar estado de suscripción
      const response = await axios.get(`${API_URL}/subscriptions/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const subscription = response.data?.subscription;
      
      // Si no hay suscripción, permitir acceso (está en trial con datos del tenant)
      if (!subscription) {
        setIsChecking(false);
        return;
      }
      
      setSubscriptionStatus(subscription.status);

      // Si la suscripción está expirada o cancelada, redirigir
      if (['expired', 'canceled', 'past_due'].includes(subscription.status)) {
        navigate('/subscription?expired=true', { replace: true });
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Error verificando suscripción:', error);
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando suscripción...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default SubscriptionGuard;
