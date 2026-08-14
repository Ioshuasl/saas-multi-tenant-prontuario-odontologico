import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CancelAction } from '../../actions/treatment_item/treatment_item_cancel.action.js';
import type { TreatmentItemCancelSchema } from '../../schemas/treatment.schema.js';
import type { TreatmentItemCancelResult } from '../../types/treatment_item/treatment_item_execute.types.js';

export class CancelService {
  constructor(private readonly cancel = new CancelAction()) {}

  async execute(
    ctx: RequestContext,
    itemId: string,
    cancelSchema: TreatmentItemCancelSchema,
  ): Promise<TreatmentItemCancelResult> {
    return this.cancel.execute(ctx, itemId, cancelSchema);
  }
}
