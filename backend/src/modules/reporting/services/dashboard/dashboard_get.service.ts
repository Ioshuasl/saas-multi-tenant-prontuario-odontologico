import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { cacheGet, cacheSet, dashboardCacheKey } from '../../helpers/reporting_cache.helper.js';
import { todayInTimezone } from '../../helpers/civil_date.helper.js';
import { tenantTimezone } from '../../helpers/reporting_period.helper.js';
import { hasFinancialReports, resolveProfessionalScope } from '../../helpers/reporting_scope.helper.js';
import { GetRepository } from '../../repositories/dashboard/dashboard_get.repository.js';
import type { DashboardQuerySchema } from '../../schemas/report.schema.js';
import type { DashboardDto } from '../../types/report/report.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, dashboardQuerySchema: DashboardQuerySchema): Promise<DashboardDto> {
    const timezone = await tenantTimezone(ctx);
    const date = dashboardQuerySchema.date ?? todayInTimezone(timezone);
    const professionalId = await resolveProfessionalScope(ctx);
    const includeFinancial = hasFinancialReports(ctx);
    const key = dashboardCacheKey({
      tenantId: ctx.tenantId,
      date,
      unitId: dashboardQuerySchema.unitId,
      professionalId,
      includeFinancial,
    });
    const cached = await cacheGet<DashboardDto>(key);
    if (cached) return cached;

    const result = await this.get.execute(ctx, {
      date,
      unitId: dashboardQuerySchema.unitId,
      professionalId,
      includeFinancial,
    });
    await cacheSet(key, result);
    return result;
  }
}
