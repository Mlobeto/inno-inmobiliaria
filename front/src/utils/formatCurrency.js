/**
 * formatCurrency.js
 * Utilidad para formatear precios en ARS y USD al estilo argentino.
 */

/**
 * Formatea un número como moneda.
 * @param {number|string} value
 * @param {'ARS'|'USD'} currency  - moneda de la propiedad
 * @param {object} options
 * @param {boolean} options.showSymbol - mostrar símbolo (default true)
 * @returns {string}
 */
export function formatCurrency(value, currency = 'ARS', { showSymbol = true } = {}) {
  const num = parseFloat(value);
  if (isNaN(num)) return showSymbol ? (currency === 'USD' ? 'USD 0' : '$ 0') : '0';

  if (currency === 'USD') {
    const formatted = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
    return showSymbol ? `USD ${formatted}` : formatted;
  }

  // ARS
  return new Intl.NumberFormat('es-AR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Convierte USD → ARS usando la cotización dólar.
 * @param {number} usdAmount
 * @param {number} usdToArsRate  - precio de VENTA del dólar en ARS
 * @returns {number}
 */
export function usdToArs(usdAmount, usdToArsRate) {
  if (!usdToArsRate || usdToArsRate <= 0) return null;
  return usdAmount * usdToArsRate;
}

/**
 * Calcula la comisión de la inmobiliaria en ARS,
 * convirtiendo si la propiedad está en USD.
 *
 * @param {number} price           - precio de la propiedad
 * @param {'ARS'|'USD'} currency   - moneda del precio
 * @param {number} comisionPct     - porcentaje de comisión (ej: 3 para 3%)
 * @param {number|null} usdToArsRate - cotización dólar venta
 * @returns {{ comisionOriginal: number, comisionARS: number|null }}
 */
export function calcularComision(price, currency, comisionPct, usdToArsRate = null) {
  const num = parseFloat(price);
  const pct = parseFloat(comisionPct);
  if (isNaN(num) || isNaN(pct)) return { comisionOriginal: 0, comisionARS: null };

  const comisionOriginal = (num * pct) / 100;

  if (currency === 'USD') {
    const comisionARS = usdToArsRate ? comisionOriginal * usdToArsRate : null;
    return { comisionOriginal, comisionARS };
  }

  return { comisionOriginal, comisionARS: comisionOriginal };
}
