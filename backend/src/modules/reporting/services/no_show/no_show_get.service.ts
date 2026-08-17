import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { resolvePeriod } from '../../helpers/reporting_period.helper.js';
import { resolveProfessionalScope } from '../../helpers/reporting_scope.helper.js';
import { GetRepository } from '../../repositories/no_show/no_show_get.repository.js';
import type { NoShowQuerySchema } from '../../schemas/report.schema.js';
import type { NoShowReportDto } from '../../types/report/report.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, noShowQuerySchema: NoShowQuerySchema): Promise<NoShowReportDto> {
    const period = await resolvePeriod(ctx, noShowQuerySchema);
    const professionalId = await resolveProfessionalScope(ctx, noShowQuerySchema.professionalId);
    return this.get.execute(ctx, period, {
      professionalId,
      unitId: noShowQuerySchema.unitId,
    });
  }
}
