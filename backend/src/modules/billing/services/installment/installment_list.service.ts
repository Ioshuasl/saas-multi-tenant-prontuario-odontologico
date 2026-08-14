import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/installment/installment_list.repository.js';
import type { InstallmentListQuerySchema } from '../../schemas/billing.schema.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(ctx: RequestContext, installmentListQuerySchema: InstallmentListQuerySchema) {
    const today = await tenantToday(ctx);
    return this.list.execute(ctx, installmentListQuerySchema, today);
  }
}
