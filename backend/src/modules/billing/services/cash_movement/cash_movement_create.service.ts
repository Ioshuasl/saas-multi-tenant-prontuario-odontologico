import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CreateAction } from '../../actions/cash_movement/cash_movement_create.action.js';
import type { CashMovementCreateSchema } from '../../schemas/billing.schema.js';

export class CreateService {
  constructor(private readonly create = new CreateAction()) {}

  execute(ctx: RequestContext, sessionId: string, cashMovementSchema: CashMovementCreateSchema) {
    return this.create.execute(ctx, sessionId, cashMovementSchema);
  }
}
