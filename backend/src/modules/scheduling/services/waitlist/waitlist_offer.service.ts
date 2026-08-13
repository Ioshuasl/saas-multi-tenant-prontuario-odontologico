import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { OfferAction } from '../../actions/waitlist/waitlist_offer.action.js';
import type { WaitlistOfferSchema } from '../../schemas/waitlist.schema.js';

export class OfferService {
  constructor(private readonly offerAction = new OfferAction()) {}

  async execute(
    ctx: RequestContext,
    waitlistId: string,
    waitlistSchema: WaitlistOfferSchema,
    idempotencyKey?: string | null,
  ) {
    return this.offerAction.execute(ctx, waitlistId, waitlistSchema, idempotencyKey);
  }
}
