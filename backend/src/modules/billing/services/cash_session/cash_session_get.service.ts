import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CashSessionNotFoundError } from '../../models/errors/billing.errors.js';
import { GetRepository } from '../../repositories/cash_session/cash_session_get.repository.js';

export class GetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(ctx: RequestContext, sessionId: string) {
    const session = await this.get.execute(ctx, sessionId);
    if (!session) throw new CashSessionNotFoundError();
    return session;
  }
}
