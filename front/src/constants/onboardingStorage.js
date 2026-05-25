const PANEL_TOUR_DONE_PREFIX = 'gestprop_panel_tour_done_';
const PANEL_TOUR_PENDING_PREFIX = 'gestprop_panel_tour_pending_';
const FORM_TOUR_DONE_PREFIX = 'gestprop_form_tour_done_';

export function formTourDoneKey(tourKey, tenantId) {
  return `${FORM_TOUR_DONE_PREFIX}${tourKey}_${tenantId}`;
}

export function isFormTourDone(tourKey, tenantId) {
  if (!tourKey || !tenantId) return true;
  return localStorage.getItem(formTourDoneKey(tourKey, tenantId)) === '1';
}

export function markFormTourDone(tourKey, tenantId) {
  if (!tourKey || !tenantId) return;
  localStorage.setItem(formTourDoneKey(tourKey, tenantId), '1');
}

export function panelTourDoneKey(tenantId) {
  return `${PANEL_TOUR_DONE_PREFIX}${tenantId}`;
}

export function isPanelTourDone(tenantId) {
  if (!tenantId) return true;
  return localStorage.getItem(panelTourDoneKey(tenantId)) === '1';
}

export function markPanelTourDone(tenantId) {
  if (!tenantId) return;
  localStorage.setItem(panelTourDoneKey(tenantId), '1');
}

/** Marca que al entrar al panel debe iniciarse el tour guiado. */
export function markPanelTourPending(tenantId) {
  if (!tenantId) return;
  sessionStorage.setItem(`${PANEL_TOUR_PENDING_PREFIX}${tenantId}`, '1');
}

/** Devuelve true si el tour del panel está pendiente (sin consumir). */
export function isPanelTourPending(tenantId) {
  if (!tenantId) return false;
  return sessionStorage.getItem(`${PANEL_TOUR_PENDING_PREFIX}${tenantId}`) === '1';
}

export function clearPanelTourPending(tenantId) {
  if (!tenantId) return;
  sessionStorage.removeItem(`${PANEL_TOUR_PENDING_PREFIX}${tenantId}`);
}

/** Devuelve true una sola vez si el tour estaba pendiente. */
export function consumePanelTourPending(tenantId) {
  if (!tenantId) return false;
  const key = `${PANEL_TOUR_PENDING_PREFIX}${tenantId}`;
  if (sessionStorage.getItem(key) === '1') {
    sessionStorage.removeItem(key);
    return true;
  }
  return false;
}

export function shouldStartPanelTour(tenantId) {
  if (!tenantId || isPanelTourDone(tenantId)) return false;
  return isPanelTourPending(tenantId);
}
