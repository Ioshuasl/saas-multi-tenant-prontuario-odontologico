import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/quote/quote_list.repository.js';
import type { QuoteListQuerySchema } from '../../schemas/quote.schema.js';
import type { QuoteListResult } from '../../types/quote/quote_crud.types.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(ctx: RequestContext, query: QuoteListQuerySchema): Promise<QuoteListResult> {
    return this.list.execute(ctx, query);
  }
}
