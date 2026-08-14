import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { PayableNotFoundError } from '../../models/errors/billing.errors.js';
import { GetRepository } from '../../repositories/payable/payable_get.repository.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, payableId: string) {
    const today = await tenantToday(ctx);
    const payable = await this.get.execute(ctx, payableId, today);
    if (!payable) throw new PayableNotFoundError();
    return payable;
  }
}
