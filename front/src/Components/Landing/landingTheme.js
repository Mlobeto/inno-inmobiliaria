/** Clases compartidas para landings públicas de tenant (paleta sage) */
export const landingShell = 'min-h-screen bg-[#0B0E0C] font-Montserrat text-textPrimary';
export const landingHeader = 'bg-bgSurface/95 backdrop-blur-md border-b border-borderBase sticky top-0 z-50';
export const landingCard = 'rounded-xl border border-borderBase bg-bgSurface';
export const landingCardGlass = 'rounded-xl border border-borderBase bg-bgSurface/80 backdrop-blur-sm';
export const landingCardHover =
  'rounded-xl border border-borderBase bg-bgSurface hover:border-borderStrong hover:bg-brand-subtle/40 transition-all duration-300';
export const landingSpinner = 'border-4 border-brand border-t-transparent rounded-full animate-spin';
export const landingBtnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-textWhite rounded-lg font-medium transition-colors shadow-brandGlow';
export const landingBtnGhost =
  'inline-flex items-center gap-2 px-4 py-2 border border-borderBase text-textSecondary hover:text-textPrimary hover:bg-brand-subtle rounded-lg transition-colors';
export const landingBtnWa =
  'inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg font-medium transition-colors';
export const landingFilterActive = 'bg-brand text-textWhite shadow-brandGlow';
export const landingFilterInactive = 'bg-bgSurface text-textSecondary hover:bg-brand-subtle border border-borderBase';
export const landingErrorBox = 'bg-customRedMuted border border-customRed/30 rounded-2xl p-8 max-w-md text-center';

export const LOTE_STATUS_STYLES = {
  DISPONIBLE: 'bg-brand-muted text-brand-light border border-borderStrong',
  RESERVADO: 'bg-customYellowMuted text-customYellow border border-customYellow/30',
  VENDIDO: 'bg-customRedMuted text-customRed border border-customRed/30',
};

export const propertyTypeBadge = (type, rentalType) => {
  if (type === 'venta') return 'bg-brand text-textWhite';
  if (rentalType === 'TEMPORAL') return 'bg-customYellow text-bgBase';
  return 'bg-brand-light text-bgBase';
};

export const propertyTypeLabel = (type, rentalType) => {
  if (type === 'venta') return 'VENTA';
  if (rentalType === 'TEMPORAL') return 'TEMPORAL';
  return 'ALQUILER';
};
