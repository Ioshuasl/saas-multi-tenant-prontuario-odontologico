import { env } from '../../../../shared/config/env.js';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getWahaSessionPort } from '../../../../shared/integrations/whatsapp/index.js';
import { AccountNotFoundError } from '../../models/errors/messaging.errors.js';
import { DisableAllAutomationsRepository } from '../../repositories/automation/automation.repository.js';
import {
  GetAccountRepository,
  UpdateAccountRepository,
} from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export class DeleteService {
  constructor(
    private readonly get = new GetAccountRepository(),
    private readonly update = new UpdateAccountRepository(),
    private readonly disableAutomations = new DisableAllAutomationsRepository(),
    private readonly waha = getWahaSessionPort(),
  ) {}

  async execute(ctx: RequestContext): Promise<WhatsappAccountSummary> {
    const account = await this.get.execute(ctx);
    if (!account) throw new AccountNotFoundError();
    if (process.env.NODE_ENV === 'test' || !env.WAHA_SESSION_NAME) {
      await this.waha.logout(account.sessionName);
    }
    const updated = await this.update.execute(ctx, {
      status: 'DISCONNECTED',
      killSwitch: true,
      lastError: null,
    });
    if (!updated) throw new AccountNotFoundError();
    await this.disableAutomations.execute(ctx);
    return updated;
  }
}
