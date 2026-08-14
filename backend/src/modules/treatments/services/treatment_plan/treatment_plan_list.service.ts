import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/treatment_plan/treatment_plan_list.repository.js';
import type { TreatmentPlanListQuerySchema } from '../../schemas/treatment.schema.js';
import type { TreatmentPlanListResult } from '../../types/treatment_plan/treatment_plan_get.types.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(ctx: RequestContext, query: TreatmentPlanListQuerySchema): Promise<TreatmentPlanListResult> {
    return this.list.execute(ctx, query);
  }
}
