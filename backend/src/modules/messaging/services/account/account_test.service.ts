import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getKeyManagement } from '../../../../shared/crypto/index.js';
import { getMessagingProvider } from '../../../../shared/integrations/whatsapp/index.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { AccountNotFoundError } from '../../models/errors/messaging.errors.js';
import {
  GetAccountRepository,
  UpdateAccountRepository,
} from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

export class TestService {
  constructor(
    private readonly get = new GetAccountRepository(),
    private readonly update = new UpdateAccountRepository(),
    private readonly kms = getKeyManagement(),
  ) {}

  async execute(ctx: RequestContext): Promise<WhatsappAccountSummary> {
    const account = await this.get.execute(ctx);
    if (!account) throw new AccountNotFoundError();
    if (account.killSwitch) {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Kill switch ativo. Reative a conta para testar.', 422);
    }

    try {
      const accessToken = await this.kms.unsealSecret(account.accessTokenRef);
      await getMessagingProvider().sendText({
        phoneNumberId: account.phoneNumberId,
        accessToken,
        to: account.displayPhone,
        body: 'Conexão WhatsApp da clínica confirmada.',
      });
      const updated = await this.update.execute(ctx, {
        status: 'CONNECTED',
        lastError: null,
        webhookVerifiedAt: new Date(),
      });
      if (!updated) throw new AccountNotFoundError();
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no teste de envio.';
      const updated = await this.update.execute(ctx, { status: 'ERROR', lastError: message });
      throw new AppError('PROVIDER_UNAVAILABLE', message, 503, { account: updated });
    }
  }
}
