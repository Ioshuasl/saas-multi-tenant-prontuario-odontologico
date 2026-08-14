import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ExecuteAction } from '../../actions/treatment_item/treatment_item_execute.action.js';
import type { TreatmentItemBatchExecuteSchema } from '../../schemas/treatment.schema.js';
import type { TreatmentItemExecuteResult } from '../../types/treatment_item/treatment_item_execute.types.js';

export class ExecuteBatchService {
  constructor(private readonly executeAction = new ExecuteAction()) {}

  async execute(
    ctx: RequestContext,
    executeSchema: TreatmentItemBatchExecuteSchema,
  ): Promise<TreatmentItemExecuteResult> {
    return this.executeAction.execute(ctx, executeSchema);
  }
}
