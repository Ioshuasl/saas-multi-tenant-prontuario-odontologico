import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TreatmentItemStatus } from '../../enum/treatment_item/treatment_item_status.enum.js';
import type { TreatmentPlanStatus } from '../../enum/treatment_plan/treatment_plan_status.enum.js';
import type { TreatmentPlanSummary } from '../../types/treatment_plan/treatment_plan_get.types.js';

export class GetActiveByPatientRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<TreatmentPlanSummary | null> {
    const plan = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.treatmentPlan.findFirst({
        where: { patientId, status: 'ACTIVE' },
        orderBy: { startedAt: 'desc' },
        include: { items: { orderBy: { createdAt: 'asc' } } },
      }),
    );
    if (!plan) return null;
    return {
      id: plan.id,
      patientId: plan.patientId,
      quoteId: plan.quoteId,
      status: plan.status as TreatmentPlanStatus,
      items: plan.items.map((item) => ({
        id: item.id,
        procedureId: item.procedureId,
        toothCode: item.toothCode,
        face: item.face,
        priceCents: Number(item.priceCents),
        status: item.status as TreatmentItemStatus,
      })),
    };
  }
}
