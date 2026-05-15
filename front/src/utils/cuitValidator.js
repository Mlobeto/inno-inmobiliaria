/**
 * Algoritmo oficial de validación de CUIT/CUIL argentino.
 *
 * 1. Se toman los primeros 10 dígitos y se multiplican por [5,4,3,2,7,6,5,4,3,2].
 * 2. Se suman los productos.
 * 3. Se calcula: verificador = 11 − (suma % 11)
 *    - Si verificador === 11 → dígito verificador = 0
 *    - Si verificador === 10 → CUIT inválido
 *    - Caso contrario         → dígito verificador = verificador
 * 4. El dígito verificador debe coincidir con el 11.º dígito del CUIT.
 */

const MULTIPLIERS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/**
 * Valida un CUIT/CUIL argentino.
 * Acepta con o sin guiones (XX-XXXXXXXX-X o XXXXXXXXXXX).
 * @param {string} raw
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCUIT(raw) {
  if (!raw) return { valid: false, message: 'El CUIT es requerido' };

  const digits = raw.replace(/\D/g, '');

  if (digits.length !== 11) {
    return { valid: false, message: 'El CUIT debe tener 11 dígitos' };
  }

  const sum = MULTIPLIERS.reduce(
    (acc, mult, i) => acc + mult * Number(digits[i]),
    0
  );

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : 11 - remainder;

  if (checkDigit === 10) {
    return { valid: false, message: 'CUIT inválido' };
  }

  if (checkDigit !== Number(digits[10])) {
    return { valid: false, message: 'El dígito verificador del CUIT no es correcto' };
  }

  return { valid: true, message: '' };
}

/**
 * Formatea una cadena de dígitos al patrón XX-XXXXXXXX-X.
 * @param {string} raw
 * @returns {string}
 */
export function formatCUIT(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}
