import { driver } from 'driver.js';
import { validateFormTourStep } from './formTourValidators';

export const DRIVER_TOUR_BASE = {
  showProgress: true,
  progressText: '{{current}} de {{total}}',
  nextBtnText: 'Siguiente',
  prevBtnText: 'Anterior',
  doneBtnText: 'Entendido',
  popoverClass: 'gestprop-driver-popover',
  overlayOpacity: 0.72,
  stagePadding: 8,
  stageRadius: 12,
  allowClose: false,
  disableActiveInteraction: false,
};

/** Filtra pasos cuyo elemento no existe en el DOM. */
export function filterTourSteps(steps = []) {
  return steps.filter((s) => {
    if (!s?.element) return false;
    if (s.element.startsWith('#')) {
      return Boolean(document.getElementById(s.element.slice(1)));
    }
    if (s.element.startsWith('[')) {
      return Boolean(document.querySelector(s.element));
    }
    return Boolean(document.querySelector(s.element));
  });
}

function stepElementId(step) {
  const el = step?.element;
  if (typeof el !== 'string') return '';
  return el.startsWith('#') ? el.slice(1) : el;
}

function attachValidatedNavigation(steps, tourKey, onValidationError) {
  return steps.map((step) => {
    const id = stepElementId(step);
    return {
      ...step,
      popover: {
        ...step.popover,
        onNextClick: (_element, _step, { driver: driverObj }) => {
          const container = id ? document.getElementById(id) : _element;
          const result = validateFormTourStep(tourKey, id, container);
          if (!result.valid) {
            onValidationError?.(result.message || 'Completá los campos para continuar');
            return;
          }
          if (driverObj.isLastStep()) {
            driverObj.destroy();
          } else {
            driverObj.moveNext();
          }
        },
        onPrevClick: (_element, _step, { driver: driverObj }) => {
          if (driverObj.hasPreviousStep()) {
            driverObj.movePrevious();
          }
        },
      },
    };
  });
}

/**
 * @param {import('driver.js').DriveStep[]} steps
 * @param {{ onComplete?: () => void, doneBtnText?: string }} options
 */
export function runDriverTour(steps, { onComplete, doneBtnText } = {}) {
  const filtered = filterTourSteps(steps);
  if (filtered.length === 0) {
    onComplete?.();
    return null;
  }

  const driverObj = driver({
    ...DRIVER_TOUR_BASE,
    ...(doneBtnText ? { doneBtnText } : {}),
    steps: filtered,
    onDestroyed: () => {
      onComplete?.();
    },
  });

  driverObj.drive();
  return driverObj;
}

/**
 * Tour de formulario: no avanza si la sección actual no pasa validación.
 */
export function runValidatedFormTour(steps, { tourKey, onComplete, onValidationError } = {}) {
  const filtered = filterTourSteps(steps);
  if (filtered.length === 0 || !tourKey) {
    onComplete?.();
    return null;
  }

  const withValidation = attachValidatedNavigation(filtered, tourKey, onValidationError);
  const lastIndex = withValidation.length - 1;
  const stepsWithDoneLabel = withValidation.map((step, index) => ({
    ...step,
    popover: {
      ...step.popover,
      ...(index === lastIndex ? { doneBtnText: 'Entendido' } : {}),
    },
  }));

  const driverObj = driver({
    ...DRIVER_TOUR_BASE,
    steps: stepsWithDoneLabel,
    onDestroyed: () => {
      onComplete?.();
    },
  });

  driverObj.drive();
  return driverObj;
}
