/**
 * Utilidades para manejo de fechas en zona horaria de Argentina (GMT-3)
 */

/**
 * Parsea una fecha de forma segura evitando conversiones UTC
 * Compatible con el parseSafeDate del backend
 * @param {string|Date} dateValue - Fecha a parsear
 * @returns {Date|null} - Fecha parseada o null si es inválida
 */
export const parseSafeDate = (dateValue) => {
  if (!dateValue) return null;
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string') {
    // Si el string contiene 'T', tomar solo la parte de fecha
    const dateOnly = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
    
    // Validar que sea un formato YYYY-MM-DD válido
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      const [year, month, day] = dateOnly.split('-').map(Number);
      // Crear fecha en hora local (mediodía para evitar problemas de zona horaria)
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }
  
  // Fallback: intentar parsear como Date normal
  const parsed = new Date(dateValue);
  // Si la fecha es válida, ajustar a mediodía para evitar cambios de día
  if (!isNaN(parsed.getTime())) {
    return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 12, 0, 0);
  }
  
  return null;
};

/**
 * Formatea una fecha de forma segura en formato DD/MM/YYYY
 * Usa parseSafeDate para evitar problemas de zona horaria
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDateSafe = (date) => {
  const d = parseSafeDate(date);
  if (!d) return 'Fecha inválida';
  
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

/**
 * Obtiene la fecha actual en Argentina (America/Argentina/Buenos_Aires)
 * Usa Intl.DateTimeFormat para obtener los componentes correctos sin importar
 * el timezone del dispositivo donde corra la app.
 * @returns {Date} Fecha actual en Argentina
 */
export const getArgentinaDate = () => {
  const now = new Date();
  // Obtener componentes de fecha/hora en zona horaria de Argentina
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(now);
  
  const get = (type) => Number(parts.find(p => p.type === type)?.value ?? 0);
  // Crear Date local con los componentes argentinos (a mediodía para evitar edge cases)
  return new Date(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
};

/**
 * Calcula la fecha de inicio del contrato según las reglas del negocio:
 * - SIEMPRE el día 1 del mes siguiente al actual
 * - Ejemplo: si hoy es 8 de marzo, el contrato inicia el 1 de abril
 * - La primera cuota corresponde al mes de inicio (abril en el ejemplo)
 * 
 * @returns {Date} Fecha de inicio calculada (día 1 del mes siguiente)
 */
export const calculateLeaseStartDate = () => {
  const today = getArgentinaDate();
  
  // Crear fecha para el día 1 del mes siguiente
  const startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
  return startDate;
};

/**
 * Formatea una fecha como string en formato ISO para inputs type="date"
 * Usa parseSafeDate para evitar desfase de timezone con strings ISO.
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const d = parseSafeDate(date);
  if (!d) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Formatea una fecha en formato legible para Argentina (DD/MM/YYYY)
 * Usa parseSafeDate para evitar problemas de zona horaria
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha en formato DD/MM/YYYY
 */
export const formatArgentinaDate = (date) => {
  // Usar formatDateSafe que ya maneja el parseo correcto
  return formatDateSafe(date);
};

/**
 * Convierte una fecha ISO string a Date en zona horaria de Argentina
 * Evita problemas de conversión UTC
 * @param {string} isoString - Fecha en formato ISO
 * @returns {Date} Fecha parseada correctamente
 */
export const parseArgentinaDate = (isoString) => {
  // Usar parseSafeDate que ya maneja esto correctamente
  return parseSafeDate(isoString);
};

/**
 * Agrega meses a una fecha
 * @param {Date} date - Fecha base
 * @param {number} months - Cantidad de meses a agregar
 * @returns {Date} Nueva fecha
 */
export const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Calcula la fecha de finalización del contrato
 * @param {Date|string} startDate - Fecha de inicio
 * @param {number} totalMonths - Duración en meses
 * @returns {Date} Fecha de finalización
 */
export const calculateLeaseEndDate = (startDate, totalMonths) => {
  const start = startDate instanceof Date ? startDate : parseArgentinaDate(startDate);
  const endDate = addMonths(start, totalMonths);
  
  // Restar 1 día para que termine el último día del mes
  endDate.setDate(endDate.getDate() - 1);
  
  return endDate;
};

/**
 * Verifica si una fecha está en Argentina (para debugging)
 * @param {Date} date - Fecha a verificar
 * @returns {Object} Información de la fecha
 */
export const debugDate = (date) => {
  return {
    date: date.toISOString(),
    localString: date.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }),
    timezoneOffset: date.getTimezoneOffset(),
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  };
};
