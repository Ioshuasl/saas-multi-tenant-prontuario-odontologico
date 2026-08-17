import { PeriodInvalidError, PeriodTooLongError } from '../models/errors/audit.errors.js';

/** Corte S8 #6: teto de 366 dias → 422 PERIOD_TOO_LONG. */
export const MAX_AUDIT_PERIOD_DAYS = 366;
export const DEFAULT_AUDIT_PERIOD_DAYS = 366;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function resolveAuditPeriod(input: { from?: Date; to?: Date }): { from: Date; to: Date } {
  const to = input.to ?? new Date();
  const from = input.from ?? new Date(to.getTime() - DEFAULT_AUDIT_PERIOD_DAYS * MS_PER_DAY);
  if (from.getTime() > to.getTime()) throw new PeriodInvalidError();
  const days = (to.getTime() - from.getTime()) / MS_PER_DAY;
  if (days > MAX_AUDIT_PERIOD_DAYS) throw new PeriodTooLongError(MAX_AUDIT_PERIOD_DAYS);
  return { from, to };
}
