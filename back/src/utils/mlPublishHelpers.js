/**
 * Validación y mensajes amigables para publicar inmuebles en Mercado Libre.
 */

function validatePropertyForMlPublish(property) {
  const missing = [];

  if (!property?.price || Number(property.price) <= 0) {
    missing.push('precio');
  }
  if (!property?.address?.trim()) {
    missing.push('dirección');
  }
  if (!property?.typeProperty) {
    missing.push('tipo de propiedad');
  }
  if (!property?.type) {
    missing.push('operación (venta o alquiler)');
  }

  const images = property?.images;
  if (!images || !Array.isArray(images) || images.length === 0) {
    missing.push('al menos una foto');
  }

  return { ok: missing.length === 0, missing };
}

function formatMlPublishError(error) {
  const raw = (
    error?.cause?.message ||
    error?.response?.data?.message ||
    error?.message ||
    String(error || '')
  ).toLowerCase();

  if (/package|paquete|listing_type|quota|credit|available_listing/i.test(raw)) {
    return 'Tu cuenta de Mercado Libre no tiene avisos disponibles. Contratá un paquete de publicación en Mercado Libre e intentá de nuevo.';
  }
  if (/picture|image|foto/i.test(raw)) {
    return 'Falta al menos una imagen válida. Subí fotos a la propiedad antes de publicar.';
  }
  if (/location|address|ubicaci|neighborhood|city/i.test(raw)) {
    return 'La ubicación no es válida para Mercado Libre. Completá dirección, barrio y ciudad.';
  }
  if (/category|categor/i.test(raw)) {
    return 'No pudimos asignar la categoría del inmueble. Revisá el tipo de propiedad y si es venta o alquiler.';
  }
  if (/title|título/i.test(raw)) {
    return 'El título del aviso no cumple los requisitos de Mercado Libre.';
  }
  if (/token|unauthorized|invalid_grant|401/i.test(raw)) {
    return 'La conexión con Mercado Libre expiró. Volvé a Integraciones y conectá tu cuenta de nuevo.';
  }
  if (/forbidden|403/i.test(raw)) {
    return 'Mercado Libre rechazó la operación. Verificá que uses la cuenta de vendedor de tu inmobiliaria (Argentina).';
  }

  return error?.message || 'No se pudo publicar en Mercado Libre. Revisá los datos de la propiedad e intentá de nuevo.';
}

module.exports = {
  validatePropertyForMlPublish,
  formatMlPublishError,
};
