import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { nextPlanStatus } from '../../models/treatment_plan.model.js';
import {
  CancelReasonRequiredError,
  ItemExecutedCancelError,
  ItemNotCancellableError,
  TreatmentItemNotFoundError,
} from '../../models/errors/treatments.errors.js';
import { CancelRepository } from '../../repositories/treatment_item/treatment_item_cancel.repository.js';
import { GetRepository } from '../../repositories/treatment_item/treatment_item_get.repository.js';
import { ListByPlanRepository } from '../../repositories/treatment_item/treatment_item_list_by_plan.repository.js';
import { UpdateStatusRepository } from '../../repositories/treatment_plan/treatment_plan_update_status.repository.js';
import type {
  TreatmentItemCancelInput,
  TreatmentItemCancelResult,
} from '../../types/treatment_item/treatment_item_execute.types.js';

export class CancelAction {
  constructor(
    private readonly get = new GetRepository(),
    private readonly cancel = new CancelRepository(),
    private readonly listByPlan = new ListByPlanRepository(),
    private readonly updatePlan = new UpdateStatusRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    itemId: string,
    cancelSchema: TreatmentItemCancelInput,
  ): Promise<TreatmentItemCancelResult> {
    const reason = cancelSchema.reason.trim();
    if (reason.length < 10) throw new CancelReasonRequiredError();

    const item = await this.get.execute(ctx, itemId);
    if (!item) throw new TreatmentItemNotFoundError();
    if (item.status === 'EXECUTED') throw new ItemExecutedCancelError();
    if (item.status !== 'PLANNED' && item.status !== 'SCHEDULED') {
      throw new ItemNotCancellableError(item.status);
    }

    return this.uow.run(ctx, async ({ tx, publish }) => {
      await this.cancel.executeInTx(tx, ctx, item.id);
      const allItems = await this.listByPlan.executeInTx(tx, item.treatmentPlanId);
      const planStatus = nextPlanStatus(
        allItems.map((row) => (row.id === item.id ? { ...row, status: 'CANCELLED' as const } : row)),
      );
      if (planStatus !== item.planStatus) {
        await this.updatePlan.executeInTx(tx, ctx, item.treatmentPlanId, planStatus);
      }
      if (planStatus === 'COMPLETED') {
        publish([
          {
            name: 'treatments.plan_completed',
            payload: {
              planId: item.treatmentPlanId,
              patientId: item.patientId,
              requestId: ctx.requestId,
            },
          },
        ]);
      }
      return {
        id: item.id,
        status: 'CANCELLED',
        planId: item.treatmentPlanId,
        planStatus,
      };
    });
  }
}
