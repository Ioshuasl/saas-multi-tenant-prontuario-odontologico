import { dateOnly } from '../helpers/money.helper.js';
import { addCalendarMonths } from '../helpers/installment_due_dates.helper.js';
import type { InstallmentStatus } from '../enum/installment/installment_status.enum.js';
import type { PayableStatus } from '../enum/payable/payable_status.enum.js';
import type { AgingBand } from '../enum/report/aging_band.enum.js';

export type PayableRecurrence = {
  frequency: 'MONTHLY';
  until?: string | null;
};

export function calendarDaysBetween(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T00:00:00.000Z`);
  const to = Date.parse(`${toYmd}T00:00:00.000Z`);
  return Math.trunc((to - from) / 86_400_000);
}

export function agingBand(daysOverdue: number): AgingBand | null {
  if (daysOverdue < 1) return null;
  if (daysOverdue <= 15) return '1_15';
  if (daysOverdue <= 30) return '16_30';
  if (daysOverdue <= 60) return '31_60';
  return '60_plus';
}

export function isPastDue(dueDate: string | Date, today: string): boolean {
  const due = typeof dueDate === 'string' ? dueDate : dateOnly(dueDate);
  return due < today;
}

export function effectiveOpenStatus<T extends string>(
  status: T,
  dueDate: string | Date,
  today: string,
  openStatuses: readonly T[],
  overdueStatus: T,
): T {
  if (openStatuses.includes(status) && isPastDue(dueDate, today)) return overdueStatus;
  return status;
}

export function effectiveInstallmentStatus(
  status: InstallmentStatus,
  dueDate: string | Date,
  today: string,
): InstallmentStatus {
  return effectiveOpenStatus(status, dueDate, today, ['OPEN', 'PARTIALLY_PAID'], 'OVERDUE');
}

export function effectivePayableStatus(
  status: PayableStatus,
  dueDate: string | Date,
  today: string,
): PayableStatus {
  return effectiveOpenStatus(status, dueDate, today, ['OPEN'], 'OVERDUE');
}

export function parsePayableRecurrence(value: unknown): PayableRecurrence | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (record.frequency !== 'MONTHLY') return null;
  const until = record.until;
  return {
    frequency: 'MONTHLY',
    until: typeof until === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : null,
  };
}

export function nextRecurrenceDueDate(
  paidDueDate: string,
  recurrence: PayableRecurrence | null,
): string | null {
  if (!recurrence) return null;
  const nextDue = addCalendarMonths(paidDueDate, 1);
  if (recurrence.until && nextDue > recurrence.until) return null;
  return nextDue;
}
