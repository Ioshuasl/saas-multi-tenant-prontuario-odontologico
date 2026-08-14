import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ReceivableNotFoundError } from '../../models/errors/billing.errors.js';
import { GetRepository } from '../../repositories/receivable/receivable_get.repository.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, receivableId: string) {
    const receivable = await this.get.execute(ctx, receivableId);
    if (!receivable) throw new ReceivableNotFoundError();
    return receivable;
  }
}
