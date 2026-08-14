import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CancelAction } from '../../actions/receivable/receivable_cancel.action.js';
import type { ReceivableCancelSchema } from '../../schemas/billing.schema.js';

export class CancelService {
  constructor(private readonly cancel = new CancelAction()) {}

  execute(
    ctx: RequestContext,
    receivableId: string,
    receivableCancelSchema: ReceivableCancelSchema,
  ) {
    return this.cancel.execute(ctx, receivableId, receivableCancelSchema);
  }
}
