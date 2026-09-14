import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { resolvePeriod } from '../../helpers/reporting_period.helper.js';
import { resolveProfessionalScope } from '../../helpers/reporting_scope.helper.js';
import { GetRepository } from '../../repositories/procedure/procedure_get.repository.js';
import type { ProcedureQuerySchema } from '../../schemas/report.schema.js';
import type { ProcedureReportDto } from '../../types/report/report.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(
    ctx: RequestContext,
    procedureQuerySchema: ProcedureQuerySchema,
  ): Promise<ProcedureReportDto> {
    const period = await resolvePeriod(ctx, procedureQuerySchema);
    const professionalId = await resolveProfessionalScope(ctx, procedureQuerySchema.professionalId);
    return this.get.execute(ctx, period, {
      professionalId,
      unitId: procedureQuerySchema.unitId,
    });
  }
}
