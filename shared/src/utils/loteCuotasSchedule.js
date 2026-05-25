const MESES_POR_PERIODO = {
  MENSUAL: 1,
  BIMESTRAL: 2,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

function clampDay(year, month, day) {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day), last);
}

/** Suma meses y fija el día del mes (ej. siempre el 10). */
export function addMonthsWithDay(baseDate, monthsToAdd, dayOfMonth = 10) {
  const base = new Date(baseDate);
  const target = new Date(base.getFullYear(), base.getMonth() + monthsToAdd, 1);
  target.setDate(clampDay(target.getFullYear(), target.getMonth(), dayOfMonth));
  target.setHours(12, 0, 0, 0);
  return target;
}

export function calcFinancingTotals(precioTotal, anticipo = 0, interes = 0, cantidadCuotas = 1) {
  const saldo = Number(precioTotal) - Number(anticipo || 0);
  const interesDecimal = interes ? Number(interes) / 100 : 0;
  const montoConInteres = interesDecimal > 0 ? saldo * (1 + interesDecimal) : saldo;
  const n = Math.max(1, Number(cantidadCuotas) || 1);
  const montoCuota = Math.ceil(montoConInteres / n);
  return { saldo, montoConInteres, montoCuota, cantidadCuotas: n };
}

/** Etiqueta de cuota para tablas (0 = Anticipo). */
export function formatCuotaLabel(numeroCuota) {
  return Number(numeroCuota) === 0 ? 'Anticipo' : String(numeroCuota);
}

function buildAnticipoCuota(anticipo, fechaBase) {
  const monto = Number(anticipo);
  if (!monto || monto <= 0) return null;
  const fecha = fechaBase ? new Date(fechaBase) : new Date();
  fecha.setHours(12, 0, 0, 0);
  return {
    numeroCuota: 0,
    fechaVencimiento: fecha,
    monto,
    pagado: true,
    notas: 'Anticipo / Seña',
  };
}

export function buildPeriodicCuotas({
  fechaBase,
  cantidadCuotas,
  periodicidad = 'MENSUAL',
  diaVencimiento = 10,
  montoCuota,
  anticipo = 0,
}) {
  const mesesPeriodo = MESES_POR_PERIODO[periodicidad] || 1;
  const base = fechaBase ? new Date(fechaBase) : new Date();
  base.setHours(12, 0, 0, 0);
  const day = Math.min(31, Math.max(1, Number(diaVencimiento) || 10));

  const financiacion = Array.from({ length: Number(cantidadCuotas) }, (_, i) => ({
    numeroCuota: i + 1,
    fechaVencimiento: addMonthsWithDay(base, (i + 1) * mesesPeriodo, day),
    monto: montoCuota,
    pagado: false,
  }));

  const anticipoRow = buildAnticipoCuota(anticipo, base);
  return anticipoRow ? [anticipoRow, ...financiacion] : financiacion;
}

/**
 * Cuotas con fechas (y montos opcionales) definidas manualmente.
 * @param {Array<{ fechaVencimiento: string|Date, monto?: number }>} cuotasCustom
 */
export function buildCustomCuotas({ cuotasCustom, montoConInteres, anticipo = 0, fechaBase }) {
  const sorted = [...cuotasCustom]
    .filter((c) => c.fechaVencimiento)
    .sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  if (sorted.length === 0 && !Number(anticipo)) return [];

  const parsed = sorted.map((c) => ({
    fechaVencimiento: new Date(c.fechaVencimiento),
    monto: c.monto != null && c.monto !== '' ? Number(c.monto) : null,
  }));

  parsed.forEach((c) => c.fechaVencimiento.setHours(12, 0, 0, 0));

  const specifiedSum = parsed.filter((c) => c.monto != null).reduce((s, c) => s + c.monto, 0);
  const unspecified = parsed.filter((c) => c.monto == null);
  const remaining = Number(montoConInteres) - specifiedSum;
  const equalShare = unspecified.length > 0 ? Math.ceil(Math.max(0, remaining) / unspecified.length) : 0;

  const financiacion = parsed.map((c, idx) => ({
    numeroCuota: idx + 1,
    fechaVencimiento: c.fechaVencimiento,
    monto: c.monto ?? equalShare,
    pagado: false,
  }));

  const anticipoRow = buildAnticipoCuota(anticipo, fechaBase);
  return anticipoRow ? [anticipoRow, ...financiacion] : financiacion;
}

/** Preview para el formulario (front y back). */
export function previewCuotasSchedule({
  modoPlan = 'periodico',
  fechaVenta,
  precioTotal,
  anticipo = 0,
  interes = 0,
  cantidadCuotas = 1,
  periodicidad = 'MENSUAL',
  diaVencimiento = 10,
  cuotasCustom = [],
}) {
  const { saldo, montoConInteres, montoCuota } = calcFinancingTotals(
    precioTotal,
    anticipo,
    interes,
    modoPlan === 'personalizado' ? cuotasCustom.filter((c) => c.fechaVencimiento).length : cantidadCuotas,
  );

  const fechaBase = fechaVenta ? new Date(fechaVenta) : new Date();
  fechaBase.setHours(12, 0, 0, 0);

  let cuotas = [];
  if (modoPlan === 'personalizado') {
    cuotas = buildCustomCuotas({
      cuotasCustom: cuotasCustom.map((c) => ({
        fechaVencimiento: c.fecha || c.fechaVencimiento,
        monto: c.monto,
      })),
      montoConInteres,
      anticipo,
      fechaBase,
    });
  } else {
    cuotas = buildPeriodicCuotas({
      fechaBase,
      cantidadCuotas,
      periodicidad,
      diaVencimiento,
      montoCuota,
      anticipo,
    });
  }

  return { saldo, montoConInteres, montoCuota, cuotas };
}

export const PERIODICIDAD_LABELS = {
  MENSUAL: 'Mensual',
  BIMESTRAL: 'Bimestral',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual',
  PERSONALIZADO: 'Fechas personalizadas',
};
