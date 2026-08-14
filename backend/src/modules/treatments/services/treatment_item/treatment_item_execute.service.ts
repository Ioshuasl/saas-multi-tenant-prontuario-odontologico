import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ExecuteAction } from '../../actions/treatment_item/treatment_item_execute.action.js';
import type { TreatmentItemExecuteSchema } from '../../schemas/treatment.schema.js';
import type { TreatmentItemExecuteResult } from '../../types/treatment_item/treatment_item_execute.types.js';

export class ExecuteService {
  constructor(private readonly executeAction = new ExecuteAction()) {}

  async execute(
    ctx: RequestContext,
    itemId: string,
    executeSchema: TreatmentItemExecuteSchema,
  ): Promise<TreatmentItemExecuteResult> {
    const toothStates = executeSchema.toothState
      ? {
          [itemId]: {
            toothState: executeSchema.toothState,
            justification: executeSchema.justification,
          },
        }
      : undefined;
    return this.executeAction.execute(ctx, {
      itemIds: [itemId],
      note: executeSchema.note,
      appointmentId: executeSchema.appointmentId,
      toothStates,
    });
  }
}
