import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { TreatmentPlanNotFoundError } from '../../models/errors/treatments.errors.js';
import { GetRepository } from '../../repositories/treatment_plan/treatment_plan_get.repository.js';
import type { TreatmentPlanDto } from '../../types/treatment_plan/treatment_plan_get.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, planId: string): Promise<TreatmentPlanDto> {
    const plan = await this.get.execute(ctx, planId);
    if (!plan) throw new TreatmentPlanNotFoundError();
    return plan;
  }
}
