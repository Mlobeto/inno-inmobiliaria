import { driver } from 'driver.js';

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
