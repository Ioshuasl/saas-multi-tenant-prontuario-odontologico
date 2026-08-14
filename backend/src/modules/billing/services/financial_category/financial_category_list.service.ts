import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/financial_category/financial_category_list.repository.js';
import type { FinancialCategoryListQuerySchema } from '../../schemas/billing.schema.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  execute(ctx: RequestContext, financialCategoryListQuerySchema: FinancialCategoryListQuerySchema) {
    return this.list.execute(ctx, financialCategoryListQuerySchema);
  }
}
