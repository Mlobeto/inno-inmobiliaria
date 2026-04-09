/**
 * Shared Constants - TypeScript Exports
 * Re-exporta las constantes de los archivos .js
 */

// ==================== ARGENTINA DATA ====================
// @ts-ignore
export {
  PROVINCIAS_ARGENTINA,
  CIUDADES_POR_PROVINCIA,
  getCiudadesByProvincia,
  findProvinciaByName,
} from './argentinLocations.js';

// ==================== COUNTRY CONFIGS ====================
// @ts-ignore
export {
  COUNTRY_CONFIGS,
  getCountryConfig,
  validateDocument,
  getDocumentPlaceholder,
  AVAILABLE_COUNTRIES,
} from './countryConfigs.js';
