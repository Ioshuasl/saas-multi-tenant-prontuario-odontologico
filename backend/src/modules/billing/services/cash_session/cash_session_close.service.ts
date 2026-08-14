import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/billing.errors.js';
import { CloseAction } from '../../actions/cash_session/cash_session_close.action.js';
import type { CashSessionCloseSchema } from '../../schemas/billing.schema.js';

export class CloseService {
  constructor(private readonly close = new CloseAction()) {}

  execute(
    ctx: RequestContext,
    sessionId: string,
    cashSessionCloseSchema: CashSessionCloseSchema,
    idempotencyKey: string | undefined,
  ) {
    const key = idempotencyKey?.trim();
    if (!key) throw new IdempotencyKeyRequiredError();
    return this.close.execute(ctx, sessionId, cashSessionCloseSchema, key);
  }
}
