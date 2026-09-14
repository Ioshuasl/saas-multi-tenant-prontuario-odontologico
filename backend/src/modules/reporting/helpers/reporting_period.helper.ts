import type { RequestContext } from '../../../shared/domain/request_context.js';
import { getPublicClinicCatalog } from '../../clinic/clinic_public.js';
import { PeriodInvalidError, PeriodTooLongError } from '../models/errors/reporting.errors.js';
import type { ReportPeriod } from '../types/report/report.types.js';
import {
  addDaysYmd,
  civilStartUtc,
  diffDays,
  todayInTimezone,
} from './civil_date.helper.js';

/** RF-E9-16 / módulo §5: default 90 dias. Sprint S7: teto 366 → 422. */
export const DEFAULT_PERIOD_DAYS = 90;
export const MAX_PERIOD_DAYS = 366;

export async function tenantTimezone(ctx: RequestContext): Promise<string> {
  const catalog = await getPublicClinicCatalog(ctx);
  return catalog?.timezone ?? 'America/Sao_Paulo';
}

export async function resolvePeriod(
  ctx: RequestContext,
  input: { from?: string; to?: string },
): Promise<ReportPeriod> {
  const timezone = await tenantTimezone(ctx);
  const today = todayInTimezone(timezone);
  const from = input.from ?? addDaysYmd(today, -(DEFAULT_PERIOD_DAYS - 1));
  const to = input.to ?? today;
  if (from > to) throw new PeriodInvalidError();
  if (diffDays(from, to) > MAX_PERIOD_DAYS) throw new PeriodTooLongError(MAX_PERIOD_DAYS);
  return {
    from,
    to,
    start: civilStartUtc(from, timezone),
    endExclusive: civilStartUtc(addDaysYmd(to, 1), timezone),
  };
}
