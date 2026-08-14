import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/billing.errors.js';
import { ReverseAction } from '../../actions/payment/payment_reverse.action.js';
import type { PaymentReverseSchema } from '../../schemas/billing.schema.js';

export class ReverseService {
  constructor(private readonly reverse = new ReverseAction()) {}

  execute(
    ctx: RequestContext,
    paymentId: string,
    paymentReverseSchema: PaymentReverseSchema,
    idempotencyKey: string | undefined,
  ) {
    const key = idempotencyKey?.trim();
    if (!key) throw new IdempotencyKeyRequiredError();
    return this.reverse.execute(ctx, paymentId, paymentReverseSchema, key);
  }
}
