import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { selectCurrentUser } from '@shared/redux';
import { isFormTourDone, markFormTourDone } from '../constants/onboardingStorage';
import { runValidatedFormTour } from '../utils/driverTour';

function getTenantId(storeUser) {
  if (storeUser?.tenantId) return storeUser.tenantId;
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')?.tenantId ?? null;
  } catch {
    return null;
  }
}

/**
 * Tour contextual la primera vez que el tenant abre un formulario.
 * No avanza de paso hasta completar los campos de la sección actual.
 */
export function useFormTour(tourKey, getSteps, deps = [], { enabled = true, delay = 650 } = {}) {
  const started = useRef(false);
  const storeUser = useSelector(selectCurrentUser);
  const tenantId = getTenantId(storeUser);

  useEffect(() => {
    if (!enabled || !tenantId || started.current || isFormTourDone(tourKey, tenantId)) {
      return undefined;
    }

    started.current = true;
    const timer = setTimeout(() => {
      const steps = getSteps();
      runValidatedFormTour(steps, {
        tourKey,
        onComplete: () => markFormTourDone(tourKey, tenantId),
        onValidationError: (message) => {
          toast.warn(message, { autoClose: 3500, toastId: `form-tour-${tourKey}` });
        },
      });
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, tourKey, enabled, delay, ...deps]);
}
