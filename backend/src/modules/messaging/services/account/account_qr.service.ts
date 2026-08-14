import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getWahaSessionPort } from '../../../../shared/integrations/whatsapp/index.js';
import { AccountNotFoundError } from '../../models/errors/messaging.errors.js';
import { GetAccountRepository } from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { WhatsappAccountQr } from '../../types/messaging.types.js';

export class GetQrService {
  constructor(
    private readonly get = new GetAccountRepository(),
    private readonly waha = getWahaSessionPort(),
  ) {}

  async execute(ctx: RequestContext): Promise<WhatsappAccountQr> {
    const account = await this.get.execute(ctx);
    if (!account) throw new AccountNotFoundError();
    return this.waha.getQr(account.sessionName);
  }
}
