import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/receivable/receivable_list.repository.js';
import type { ReceivableListQuerySchema } from '../../schemas/billing.schema.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  execute(ctx: RequestContext, receivableListQuerySchema: ReceivableListQuerySchema) {
    return this.list.execute(ctx, receivableListQuerySchema);
  }
}
