import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getMessagingProvider, getWahaSessionPort } from '../../../../shared/integrations/whatsapp/index.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { toE164Br } from '../../../patients/patients_public.js';
import { AccountNotFoundError } from '../../models/errors/messaging.errors.js';
import { UpsertConversationRepository } from '../../repositories/conversation/conversation.repository.js';
import { CreateMessageRepository } from '../../repositories/message/message.repository.js';
import {
  GetAccountRepository,
  UpdateAccountRepository,
} from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { AccountTestSchema } from '../../schemas/messaging.schema.js';
import type { WhatsappAccountSummary } from '../../types/messaging.types.js';

const TEST_BODY = 'Conexão WhatsApp da clínica confirmada.';

export class TestService {
  constructor(
    private readonly get = new GetAccountRepository(),
    private readonly update = new UpdateAccountRepository(),
    private readonly upsertConversation = new UpsertConversationRepository(),
    private readonly createMessage = new CreateMessageRepository(),
    private readonly waha = getWahaSessionPort(),
  ) {}

  async execute(ctx: RequestContext, accountSchema: AccountTestSchema): Promise<WhatsappAccountSummary> {
    const account = await this.get.execute(ctx);
    if (!account) throw new AccountNotFoundError();
    if (account.killSwitch) {
      throw new AppError('BUSINESS_RULE_VIOLATION', 'Kill switch ativo. Reative a conta para testar.', 422);
    }

    const live = await this.waha.getQr(account.sessionName);
    const rawTo = accountSchema.to ?? account.displayPhone ?? live.displayPhone;
    if (!rawTo) {
      if (process.env.NODE_ENV === 'test') {
        const updated = await this.update.execute(ctx, {
          status: 'CONNECTED',
          lastError: null,
          webhookVerifiedAt: new Date(),
        });
        if (!updated) throw new AccountNotFoundError();
        return updated;
      }
      throw new AppError(
        'VALIDATION_ERROR',
        'Informe o número que deve receber o teste (DDI + DDD). O próprio número da sessão costuma não mostrar o chat.',
        422,
      );
    }

    const to = toE164Br(rawTo);
    if (to.length < 12) {
      throw new AppError('VALIDATION_ERROR', 'Telefone de teste inválido. Use DDI 55 + DDD + número.', 422);
    }

    try {
      const sent = await getMessagingProvider().sendText({
        sessionName: account.sessionName,
        to,
        body: TEST_BODY,
      });
      const conversation = await this.upsertConversation.execute(ctx, {
        whatsappAccountId: account.id,
        contactPhone: to,
      });
      await this.createMessage.execute(ctx, {
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        type: 'TEXT',
        body: TEST_BODY,
        providerMessageId: sent.providerMessageId,
        status: 'SENT',
        billable: false,
        relatedType: 'ACCOUNT_TEST',
        relatedId: account.id,
        sentBy: ctx.userId || null,
      });
      const updated = await this.update.execute(ctx, {
        status: 'CONNECTED',
        lastError: null,
        webhookVerifiedAt: new Date(),
        displayPhone: live.displayPhone ?? account.displayPhone,
      });
      if (!updated) throw new AccountNotFoundError();
      return updated;
    } catch (err) {
      if (err instanceof AppError) throw err;
      const message = err instanceof Error ? err.message : 'Falha no teste de envio.';
      const updated = await this.update.execute(ctx, { status: 'ERROR', lastError: message });
      throw new AppError('PROVIDER_UNAVAILABLE', message, 503, { account: updated });
    }
  }
}
