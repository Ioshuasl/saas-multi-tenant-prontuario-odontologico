import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { SendAction } from '../../actions/quote/quote_send.action.js';
import type { QuoteSendSchema } from '../../schemas/quote.schema.js';
import type { QuoteSendResult } from '../../types/quote/quote_send.types.js';

export class SendService {
  constructor(private readonly send = new SendAction()) {}

  async execute(
    ctx: RequestContext,
    quoteId: string,
    sendSchema: QuoteSendSchema,
  ): Promise<QuoteSendResult> {
    return this.send.execute(ctx, quoteId, sendSchema);
  }
}
