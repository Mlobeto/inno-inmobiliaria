/** Colores de marcadores en el plano según estado del lote */
export const LOTE_PLAN_MARKER = {
  DISPONIBLE: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-300/80',
    border: 'border-emerald-400',
    label: 'Disponible',
  },
  RESERVADO: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-300/80',
    border: 'border-amber-400',
    label: 'Reservado',
  },
  VENDIDO: {
    dot: 'bg-red-500',
    ring: 'ring-red-300/80',
    border: 'border-red-400',
    label: 'Vendido',
  },
};

export function getLotePlanMarkerStyle(status) {
  return LOTE_PLAN_MARKER[status] || LOTE_PLAN_MARKER.DISPONIBLE;
}

/** Convierte coordenadas de puntero a fracción 0–1 dentro del contenedor del plano */
export function pointerToPlanCoords(clientX, clientY, rect) {
  if (!rect?.width || !rect?.height) return { planX: 0.5, planY: 0.5 };
  const planX = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const planY = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  return { planX, planY };
}

export function isLoteOnPlan(lote) {
  return lote?.planX != null && lote?.planY != null;
}

export const LOTE_PLAN_LEGEND = [
  { status: 'DISPONIBLE', color: 'bg-emerald-500', label: 'Disponible' },
  { status: 'RESERVADO', color: 'bg-amber-500', label: 'Reservado' },
  { status: 'VENDIDO', color: 'bg-red-500', label: 'Vendido' },
];
