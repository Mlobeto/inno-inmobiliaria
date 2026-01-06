/**
 * Mapeo de categorías de propiedades a categorías de MercadoLibre Argentina
 * https://api.mercadolibre.com/sites/MLA/categories
 */

// Categorías de MercadoLibre para inmuebles en Argentina
const ML_CATEGORIES = {
  // VENTA
  departamento_venta: 'MLA1473', // Departamentos
  casa_venta: 'MLA1472', // Casas
  ph_venta: 'MLA1474', // PH (Propiedad Horizontal)
  terreno_venta: 'MLA1476', // Terrenos y Lotes
  local_venta: 'MLA1477', // Locales Comerciales
  oficina_venta: 'MLA1479', // Oficinas Comerciales
  cochera_venta: 'MLA105973', // Cocheras
  galpon_venta: 'MLA105972', // Galpones
  
  // ALQUILER
  departamento_alquiler: 'MLA1459', // Departamentos
  casa_alquiler: 'MLA1468', // Casas
  ph_alquiler: 'MLA105971', // PH (Propiedad Horizontal)
  local_alquiler: 'MLA1478', // Locales Comerciales
  oficina_alquiler: 'MLA1480', // Oficinas Comerciales
  cochera_alquiler: 'MLA105974', // Cocheras
  galpon_alquiler: 'MLA105972', // Galpones
  
  // ALQUILER TEMPORAL
  departamento_alquiler_temporal: 'MLA51072', // Departamentos temporarios
  casa_alquiler_temporal: 'MLA51073', // Casas temporarias
};

/**
 * Obtiene la categoría de MercadoLibre según el tipo de propiedad
 * @param {Object} property - Objeto de propiedad
 * @param {string} property.type - Tipo de operación: 'venta' o 'alquiler'
 * @param {string} property.typeProperty - Tipo de propiedad: 'Departamento', 'Casa', 'PH', etc.
 * @returns {string} ID de categoría de MercadoLibre
 */
function getMercadoLibreCategory(property) {
  const { type, typeProperty } = property;
  
  if (!type || !typeProperty) {
    // Categoría por defecto: Departamentos en alquiler
    return ML_CATEGORIES.departamento_alquiler;
  }
  
  // Normalizar tipo de propiedad
  const normalizedType = typeProperty.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remover acentos
  
  // Construir clave para el mapeo
  const key = `${normalizedType}_${type.toLowerCase()}`;
  
  // Buscar categoría exacta
  if (ML_CATEGORIES[key]) {
    return ML_CATEGORIES[key];
  }
  
  // Mapeos aproximados si no hay coincidencia exacta
  const approximateMatches = {
    'depto': 'departamento',
    'dpto': 'departamento',
    'garage': 'cochera',
    'estacionamiento': 'cochera',
    'bodega': 'galpon',
    'deposito': 'galpon',
    'comercio': 'local',
  };
  
  // Intentar con mapeo aproximado
  for (const [alias, normalized] of Object.entries(approximateMatches)) {
    if (normalizedType.includes(alias)) {
      const approximateKey = `${normalized}_${type.toLowerCase()}`;
      if (ML_CATEGORIES[approximateKey]) {
        return ML_CATEGORIES[approximateKey];
      }
    }
  }
  
  // Si no hay coincidencia, devolver categoría por defecto según tipo de operación
  if (type.toLowerCase() === 'venta') {
    return ML_CATEGORIES.departamento_venta;
  }
  
  return ML_CATEGORIES.departamento_alquiler;
}

/**
 * Obtiene el listing type (tipo de publicación) recomendado
 * @param {string} planId - ID del plan del tenant
 * @returns {string} Tipo de publicación ML
 */
function getListingType(planId) {
  // free: Solo publicación gratuita básica
  // classified: Publicación clasificada estándar (gratis limitado)
  // gold_special: Publicación destacada (pago)
  // gold_premium: Publicación premium (pago superior)
  
  switch (planId) {
    case 'enterprise':
      return 'gold_special'; // Destacada para plan enterprise
    case 'professional':
      return 'gold_special'; // Destacada para plan professional
    case 'basic':
    default:
      return 'classified'; // Clasificada gratis
  }
}

module.exports = {
  ML_CATEGORIES,
  getMercadoLibreCategory,
  getListingType,
};
