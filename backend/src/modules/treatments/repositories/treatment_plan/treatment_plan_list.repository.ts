import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TreatmentPlanStatus } from '../../enum/treatment_plan/treatment_plan_status.enum.js';
import type { TreatmentPlanListResult } from '../../types/treatment_plan/treatment_plan_get.types.js';
import { toPlanListItemDto } from './mappers/treatment_plan.mapper.js';

export type PlanListQuery = {
  patientId?: string;
  status?: TreatmentPlanStatus;
  cursor?: string;
  limit?: number;
};

const planInclude = {
  items: {
    include: { procedure: { select: { code: true, name: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
} as const;

export class ListRepository {
  async execute(ctx: RequestContext, query: PlanListQuery): Promise<TreatmentPlanListResult> {
    const limit = query.limit ?? 20;
    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.treatmentPlan.findMany({
        where: {
          ...(query.patientId ? { patientId: query.patientId } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.cursor ? { id: { lt: query.cursor } } : {}),
        },
        include: planInclude,
        orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
        take: limit + 1,
      }),
    );
    const page = rows.slice(0, limit);
    const next = rows.length > limit ? page[page.length - 1]?.id ?? null : null;
    return {
      items: page.map(toPlanListItemDto),
      nextCursor: next,
    };
  }
}
