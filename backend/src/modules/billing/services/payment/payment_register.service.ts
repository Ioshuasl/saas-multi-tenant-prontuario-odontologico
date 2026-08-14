import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/billing.errors.js';
import { RegisterAction } from '../../actions/payment/payment_register.action.js';
import type { PaymentCreateSchema } from '../../schemas/billing.schema.js';

export class RegisterService {
  constructor(private readonly register = new RegisterAction()) {}

  execute(
    ctx: RequestContext,
    installmentId: string,
    paymentSchema: PaymentCreateSchema,
    idempotencyKey: string | undefined,
  ) {
    const key = idempotencyKey?.trim();
    if (!key) throw new IdempotencyKeyRequiredError();
    return this.register.execute(ctx, installmentId, paymentSchema, key);
  }
}
