import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ListRepository } from '../../repositories/payable/payable_list.repository.js';
import type { PayableListQuerySchema } from '../../schemas/billing.schema.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';

export class ListService {
  constructor(private readonly list = new ListRepository()) {}

  async execute(ctx: RequestContext, payableListQuerySchema: PayableListQuerySchema) {
    const today = await tenantToday(ctx);
    return this.list.execute(ctx, payableListQuerySchema, today);
  }
}
