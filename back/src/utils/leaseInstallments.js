/**
 * Calendario de cuotas de un contrato (misma lógica que InstallmentSelector en el front).
 */

function parseSafeDate(dateValue) {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    const dateOnly = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
      const [year, month, day] = dateOnly.split('-').map(Number);
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }
  const d = new Date(dateValue);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatPeriodLabel(installmentDate) {
  const monthName = installmentDate.toLocaleDateString('es-AR', { month: 'long' });
  const year = installmentDate.getFullYear();
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
}

/**
 * @param {object} lease - contrato con startDate, totalMonths, rentAmount, id
 * @param {object[]} existingReceipts - PaymentReceipts del contrato (type installment)
 */
function buildLeaseInstallmentSchedule(lease, existingReceipts = []) {
  const startDate = parseSafeDate(lease.startDate);
  if (!startDate) return [];

  const duration = parseInt(lease.totalMonths, 10) || 12;
  const receipts = existingReceipts.filter((r) => r.type === 'installment');
  const byNumber = Object.fromEntries(
    receipts.filter((r) => r.installmentNumber != null).map((r) => [r.installmentNumber, r])
  );

  const schedule = [];
  for (let i = 0; i < duration; i++) {
    const installmentNumber = i + 1;
    const installmentDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const period = formatPeriodLabel(installmentDate);
    const receipt = byNumber[installmentNumber] || null;
    const isPaid =
      receipt?.status === 'paid' ||
      receipts.some(
        (p) =>
          p.installmentNumber === installmentNumber &&
          p.status === 'paid' &&
          p.leaseId === lease.id
      );

    schedule.push({
      leaseId: lease.id,
      installmentNumber,
      totalInstallments: duration,
      period,
      paymentDate: installmentDate.toISOString(),
      amount: lease.rentAmount,
      status: isPaid ? 'paid' : receipt?.status === 'pending' ? 'pending' : 'pending',
      receiptId: receipt?.id ?? null,
      voucherUrl: receipt?.voucherUrl ?? null,
      voucherStatus: receipt?.voucherStatus ?? 'none',
      voucherRejReason: receipt?.voucherRejReason ?? null,
      paidAt: receipt?.paidAt ?? null,
      paymentMethodId: receipt?.paymentMethodId ?? null,
      isPaid,
      canReportPayment: !isPaid,
    });
  }

  return schedule;
}

module.exports = {
  parseSafeDate,
  formatPeriodLabel,
  buildLeaseInstallmentSchedule,
};
