import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  applyExceptionOverlays,
  intervalsToUtcWindows,
  intersectIntervals,
  isoWeekdayFromYmd,
  type WorkingWindow,
} from '../../helpers/working_windows.helper.js';
import { GetWorkingWindowsSourceRepository } from '../../repositories/business_hours/working_windows.repository.js';

export type GetWorkingWindowsInput = {
  tenantId: string;
  unitId: string;
  professionalId?: string;
  date: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class GetService {
  constructor(private readonly source = new GetWorkingWindowsSourceRepository()) {}

  async execute(input: GetWorkingWindowsInput): Promise<WorkingWindow[]> {
    if (!DATE_RE.test(input.date)) {
      throw new Error(`Data inválida: ${input.date}`);
    }

    const ctx: RequestContext = {
      tenantId: input.tenantId,
      userId: input.tenantId,
      requestId: 'clinic:getWorkingWindows',
    };

    const weekday = isoWeekdayFromYmd(input.date);
    const source = await this.source.execute(ctx, {
      unitId: input.unitId,
      professionalId: input.professionalId,
      weekday,
      dateYmd: input.date,
    });

    if (!source) return [];

    const weekly =
      source.professionalIntervals === null
        ? source.unitIntervals
        : intersectIntervals(source.unitIntervals, source.professionalIntervals);

    const effective = applyExceptionOverlays(weekly, source.exceptions);
    return intervalsToUtcWindows(input.date, effective, source.timezone);
  }
}
