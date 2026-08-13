import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AccountNotFoundError } from '../../models/errors/messaging.errors.js';
import { GetAccountRepository } from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export class GetService {
  constructor(private readonly get = new GetAccountRepository()) {}

  async execute(ctx: RequestContext): Promise<WhatsappAccountSummary> {
    const account = await this.get.execute(ctx);
    if (!account) throw new AccountNotFoundError();
    const { accessTokenRef: _token, ...summary } = account;
    return summary;
  }
}
