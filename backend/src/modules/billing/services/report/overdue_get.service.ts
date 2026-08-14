import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';
import { GetRepository } from '../../repositories/report/overdue_get.repository.js';
import type { OverdueReportQuerySchema } from '../../schemas/billing.schema.js';
import type { OverdueReportDto } from '../../types/report/report.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(
    ctx: RequestContext,
    overdueReportQuerySchema: OverdueReportQuerySchema,
  ): Promise<OverdueReportDto> {
    const today = await tenantToday(ctx);
    return this.get.execute(ctx, overdueReportQuerySchema, today);
  }
}
