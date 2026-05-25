import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@shared/redux';
import { isFormTourDone, markFormTourDone } from '../constants/onboardingStorage';
import { runDriverTour } from '../utils/driverTour';

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
 * @param {string} tourKey — 'clientes' | 'propiedades' | 'contratos'
 * @param {() => import('driver.js').DriveStep[]} getSteps
 * @param {unknown[]} deps — dependencias para re-evaluar (ej. formData.propertyId)
 * @param {{ enabled?: boolean, delay?: number }} options
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
      runDriverTour(steps, {
        onComplete: () => markFormTourDone(tourKey, tenantId),
      });
    }, delay);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, tourKey, enabled, delay, ...deps]);
}
