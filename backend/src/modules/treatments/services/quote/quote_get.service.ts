import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { QuoteNotFoundError } from '../../models/errors/treatments.errors.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, quoteId: string): Promise<QuoteDto> {
    const quote = await this.get.execute(ctx, quoteId);
    if (!quote) throw new QuoteNotFoundError();
    return quote;
  }
}
