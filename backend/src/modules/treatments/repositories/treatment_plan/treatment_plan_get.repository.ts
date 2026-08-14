import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TreatmentPlanDto } from '../../types/treatment_plan/treatment_plan_get.types.js';
import { toPlanDto } from './mappers/treatment_plan.mapper.js';

const planInclude = {
  items: {
    include: { procedure: { select: { code: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export class GetRepository {
  async execute(ctx: RequestContext, planId: string): Promise<TreatmentPlanDto | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.treatmentPlan.findFirst({
        where: { id: planId },
        include: planInclude,
      }),
    );
    return row ? toPlanDto(row) : null;
  }
}
