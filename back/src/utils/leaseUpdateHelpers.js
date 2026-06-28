/**
 * Cálculo de fechas y períodos de actualización de alquiler.
 * Basado en RentUpdate (no lease.updatedAt) y alineado a startDate.
 */

const { parseSafeDate } = require('./leaseInstallments');

function getFreqMonths(updateFrequency) {
  switch (updateFrequency) {
    case 'trimestral': return 3;
    case 'cuatrimestral': return 4;
    case 'semestral': return 6;
    case 'anual': return 12;
    default: return 0;
  }
}

function monthsBetween(fromDate, toDate) {
  const from = parseSafeDate(fromDate);
  const to = parseSafeDate(toDate);
  if (!from || !to) return 0;
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function calculateUpdatePeriod(startDate, updateFrequency, updateDate) {
  const monthsDiff = monthsBetween(startDate, updateDate);

  switch (updateFrequency) {
    case 'trimestral':
      return `Trimestre ${Math.floor(monthsDiff / 3) + 1}`;
    case 'cuatrimestral':
      return `Cuatrimestre ${Math.floor(monthsDiff / 4) + 1}`;
    case 'semestral':
      return `Semestre ${Math.floor(monthsDiff / 6) + 1}`;
    case 'anual':
      return `Año ${Math.floor(monthsDiff / 12) + 1}`;
    default:
      return 'Desconocido';
  }
}

function getNextUpdateDate(startDate, updateFrequency) {
  const freqMonths = getFreqMonths(updateFrequency);
  if (!freqMonths) return null;

  const start = parseSafeDate(startDate);
  const now = new Date();
  const monthsSinceStart = monthsBetween(start, now);
  const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);

  const nextUpdate = parseSafeDate(start);
  nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);
  return nextUpdate;
}

function computeUpdateInfo(lease) {
  const start = parseSafeDate(lease.startDate);
  const createdAt = parseSafeDate(lease.createdAt);
  const now = new Date();
  const freqMonths = getFreqMonths(lease.updateFrequency);

  const empty = {
    monthsSinceStart: 0,
    monthsSinceLastUpdate: 0,
    shouldUpdate: false,
    lastUpdateDate: null,
    nextUpdateDate: null,
    periodsElapsed: 0,
    hasUpdates: false,
    isOldContractRecentlyLoaded: false,
  };

  if (!start || !freqMonths) return empty;

  // Contrato vencido o terminado
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + (lease.totalMonths || 0));
  if (endDate < now || lease.status === 'terminated') {
    return { ...empty, nextUpdateDate: endDate };
  }

  const lastUpdate = lease.RentUpdates?.[0] || null;
  const monthsSinceStart = monthsBetween(start, now);

  // CASO 1: tiene actualizaciones registradas
  if (lastUpdate) {
    const monthsSinceLastUpdate = monthsBetween(lastUpdate.updateDate, now);
    const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);
    const shouldUpdate = monthsSinceLastUpdate >= freqMonths;

    const nextUpdate = parseSafeDate(start);
    nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);

    return {
      monthsSinceStart,
      monthsSinceLastUpdate,
      shouldUpdate,
      lastUpdateDate: lastUpdate.updateDate,
      nextUpdateDate: nextUpdate,
      periodsElapsed,
      hasUpdates: true,
      isOldContractRecentlyLoaded: false,
    };
  }

  // CASO 2: contrato viejo recién cargado (createdAt >> startDate)
  const monthsBetweenStartAndCreation = monthsBetween(start, createdAt);
  const isOldContractRecentlyLoaded = monthsBetweenStartAndCreation > 2;

  if (isOldContractRecentlyLoaded && createdAt) {
    const monthsSinceCreation = monthsBetween(createdAt, now);
    const periodsElapsedSinceLoad = Math.floor(monthsSinceCreation / freqMonths);
    const shouldUpdate = periodsElapsedSinceLoad > 0;
    const periodsElapsedTotal = Math.floor(monthsSinceStart / freqMonths);

    const nextUpdate = parseSafeDate(start);
    nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsedTotal + 1) * freqMonths);

    return {
      monthsSinceStart,
      monthsSinceLastUpdate: monthsSinceCreation,
      shouldUpdate,
      lastUpdateDate: createdAt,
      nextUpdateDate: nextUpdate,
      periodsElapsed: periodsElapsedTotal,
      hasUpdates: false,
      isOldContractRecentlyLoaded: true,
    };
  }

  // CASO 3: contrato nuevo
  const periodsElapsed = Math.floor(monthsSinceStart / freqMonths);
  const shouldUpdate = periodsElapsed > 0;

  const nextUpdate = parseSafeDate(start);
  nextUpdate.setMonth(nextUpdate.getMonth() + (periodsElapsed + 1) * freqMonths);

  return {
    monthsSinceStart,
    monthsSinceLastUpdate: monthsSinceStart,
    shouldUpdate,
    lastUpdateDate: null,
    nextUpdateDate: nextUpdate,
    periodsElapsed,
    hasUpdates: false,
    isOldContractRecentlyLoaded: false,
  };
}

function leaseNeedsPendingUpdate(lease) {
  const info = computeUpdateInfo(lease);
  return info.shouldUpdate;
}

module.exports = {
  parseSafeDate,
  getFreqMonths,
  monthsBetween,
  calculateUpdatePeriod,
  getNextUpdateDate,
  computeUpdateInfo,
  leaseNeedsPendingUpdate,
};
