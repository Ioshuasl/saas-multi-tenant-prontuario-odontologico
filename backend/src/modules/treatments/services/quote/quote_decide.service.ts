import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/treatments.errors.js';
import { DecideAction } from '../../actions/quote/quote_decide.action.js';
import type { QuoteDecisionInput, QuoteDecisionResult } from '../../types/quote/quote_decision.types.js';

export class DecideService {
  constructor(private readonly decide = new DecideAction()) {}

  async execute(
    ctx: RequestContext,
    quoteId: string,
    quoteDecisionSchema: QuoteDecisionInput,
    idempotencyKey: string | undefined,
  ): Promise<QuoteDecisionResult> {
    if (!idempotencyKey?.trim()) throw new IdempotencyKeyRequiredError();
    return this.decide.execute(ctx, quoteId, quoteDecisionSchema, idempotencyKey, {
      decidedBy: 'USER',
    });
  }
}
