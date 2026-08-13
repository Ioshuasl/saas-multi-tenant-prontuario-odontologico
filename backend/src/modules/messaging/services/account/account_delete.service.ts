import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AccountNotFoundError } from '../../models/errors/messaging.errors.js';
import { DisableAllAutomationsRepository } from '../../repositories/automation/automation.repository.js';
import { UpdateAccountRepository } from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export class DeleteService {
  constructor(
    private readonly update = new UpdateAccountRepository(),
    private readonly disableAutomations = new DisableAllAutomationsRepository(),
  ) {}

  async execute(ctx: RequestContext): Promise<WhatsappAccountSummary> {
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
