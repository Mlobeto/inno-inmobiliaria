import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const WARNING_BEFORE_MS = 5 * 60 * 1000; // avisar 5 minutos antes

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convertir a ms
  } catch {
    return null;
  }
}

export function useTokenExpiry() {
  const token = useSelector((state) => state.token);
  const dispatch = useDispatch();
  const warningToastId = useRef(null);
  const warningTimer = useRef(null);
  const logoutTimer = useRef(null);

  useEffect(() => {
    // Limpiar timers anteriores
    clearTimeout(warningTimer.current);
    clearTimeout(logoutTimer.current);
    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
      warningToastId.current = null;
    }

    if (!token) return;

    const expiresAt = getTokenExpiry(token);
    if (!expiresAt) return;

    const now = Date.now();
    const msUntilExpiry = expiresAt - now;

    if (msUntilExpiry <= 0) {
      // Ya expiró — limpiar sesión inmediatamente
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      window.location.href = '/login';
      return;
    }

    const msUntilWarning = msUntilExpiry - WARNING_BEFORE_MS;

    if (msUntilWarning > 0) {
      // Programar aviso 5 min antes de vencer
      warningTimer.current = setTimeout(() => {
        warningToastId.current = toast.warning(
          '⚠️ Tu sesión vence en 5 minutos. Guardá tu trabajo y volvé a iniciar sesión.',
          {
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            toastId: 'token-expiry-warning',
          }
        );
      }, msUntilWarning);
    } else {
      // Queda menos de 5 minutos — mostrar aviso ya
      warningToastId.current = toast.warning(
        `⚠️ Tu sesión vence en menos de 5 minutos. Guardá tu trabajo y volvé a iniciar sesión.`,
        {
          autoClose: false,
          closeOnClick: false,
          draggable: false,
          toastId: 'token-expiry-warning',
        }
      );
    }

    // Programar logout automático al vencer
    logoutTimer.current = setTimeout(() => {
      toast.dismiss('token-expiry-warning');
      toast.error('Tu sesión expiró. Iniciá sesión nuevamente.', { autoClose: 4000 });
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }, msUntilExpiry);

    return () => {
      clearTimeout(warningTimer.current);
      clearTimeout(logoutTimer.current);
    };
  }, [token, dispatch]);
}
