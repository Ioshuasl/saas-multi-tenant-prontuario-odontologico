import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { resolvePublicTokenByHash } from '../../../scheduling/scheduling_public.js';
import { IdempotencyKeyRequiredError, PublicQuoteTokenError } from '../../models/errors/treatments.errors.js';
import { DecideAction } from '../../actions/quote/quote_decide.action.js';
import { FindByIdempotencyRepository } from '../../repositories/quote/quote_find_idempotency.repository.js';
import type { QuoteDecisionInput, QuoteDecisionResult } from '../../types/quote/quote_decision.types.js';

export class PublicDecideService {
  constructor(
    private readonly decide = new DecideAction(),
    private readonly findIdempotency = new FindByIdempotencyRepository(),
  ) {}

  async execute(
    requestId: string,
    rawToken: string,
    quoteDecisionSchema: QuoteDecisionInput,
    idempotencyKey: string | undefined,
  ): Promise<QuoteDecisionResult> {
    if (!idempotencyKey?.trim()) throw new IdempotencyKeyRequiredError();
    const token = await resolvePublicTokenByHash(hashToken(rawToken));
    if (!token || token.purpose !== 'QUOTE') throw new PublicQuoteTokenError();

    const quoteId = token.targetId ?? token.meta.quoteId ?? null;
    if (!quoteId) throw new PublicQuoteTokenError();

    const ctx: RequestContext = { tenantId: token.tenantId, userId: '', requestId };

    if (token.usedAt) {
      const existing = await this.findIdempotency.execute(ctx, idempotencyKey.trim());
      if (!existing || existing.id !== quoteId) throw new PublicQuoteTokenError();
    } else if (token.expiresAt.getTime() < Date.now()) {
      throw new PublicQuoteTokenError();
    }

    return this.decide.execute(ctx, quoteId, quoteDecisionSchema, idempotencyKey, {
      decidedBy: 'PATIENT_LINK',
      publicTokenId: token.usedAt ? null : token.id,
      enforceGuardian: true,
    });
  }
}
