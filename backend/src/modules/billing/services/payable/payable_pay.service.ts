import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/billing.errors.js';
import { PayAction } from '../../actions/payable/payable_pay.action.js';
import type { PayablePaySchema } from '../../schemas/billing.schema.js';

export class PayService {
  constructor(private readonly pay = new PayAction()) {}

  execute(
    ctx: RequestContext,
    payableId: string,
    payablePaySchema: PayablePaySchema,
    idempotencyKey: string | undefined,
  ) {
    const key = idempotencyKey?.trim();
    if (!key) throw new IdempotencyKeyRequiredError();
    return this.pay.execute(ctx, payableId, payablePaySchema, key);
  }
}
