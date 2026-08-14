import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/billing.errors.js';
import { OpenAction } from '../../actions/cash_session/cash_session_open.action.js';
import type { CashSessionCreateSchema } from '../../schemas/billing.schema.js';

export class OpenService {
  constructor(private readonly open = new OpenAction()) {}

  execute(
    ctx: RequestContext,
    cashSessionSchema: CashSessionCreateSchema,
    idempotencyKey: string | undefined,
  ) {
    const key = idempotencyKey?.trim();
    if (!key) throw new IdempotencyKeyRequiredError();
    return this.open.execute(ctx, cashSessionSchema, key);
  }
}
