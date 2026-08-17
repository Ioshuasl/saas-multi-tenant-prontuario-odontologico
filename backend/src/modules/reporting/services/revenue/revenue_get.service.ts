import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { resolvePeriod } from '../../helpers/reporting_period.helper.js';
import { GetRepository } from '../../repositories/revenue/revenue_get.repository.js';
import type { RevenueQuerySchema } from '../../schemas/report.schema.js';
import type { RevenueReportDto } from '../../types/report/report.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, revenueQuerySchema: RevenueQuerySchema): Promise<RevenueReportDto> {
    const period = await resolvePeriod(ctx, revenueQuerySchema);
    return this.get.execute(ctx, period, revenueQuerySchema.groupBy ?? 'day', {
      unitId: revenueQuerySchema.unitId,
    });
  }
}
