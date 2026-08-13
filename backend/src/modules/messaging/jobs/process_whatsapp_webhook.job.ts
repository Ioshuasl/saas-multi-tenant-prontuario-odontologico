import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import type { RequestContext } from '../../../shared/domain/request_context.js';
import { appendOutboxEvent } from '../../../shared/database/outbox.js';
import { getTenantPrisma } from '../../../shared/database/tenant_prisma.js';
import {
  applyCancellationFromPatient,
  applyConfirmationFromPatient,
  applyWaitlistAcceptByOfferId,
} from '../../scheduling/scheduling_public.js';
import { findPatientIdByPhone, toE164Br } from '../../patients/patients_public.js';
import { GetAccountRepository } from '../repositories/whatsapp_account/whatsapp_account.repository.js';
import { AppendCreditLedgerRepository } from '../repositories/credit/credit.repository.js';
import {
  UpdateConversationStatusRepository,
  UpsertConversationRepository,
} from '../repositories/conversation/conversation.repository.js';
import {
  CreateMessageRepository,
  UpdateMessageByProviderIdRepository,
} from '../repositories/message/message.repository.js';
import { parseButtonAction, parseWhatsappWebhook } from '../helpers/webhook.helper.js';

const getAccount = new GetAccountRepository();
const upsertConversation = new UpsertConversationRepository();
const updateConversation = new UpdateConversationStatusRepository();
const createMessage = new CreateMessageRepository();
const updateByProvider = new UpdateMessageByProviderIdRepository();
const appendCredit = new AppendCreditLedgerRepository();

const LOW_THRESHOLD = 10;

function mapProviderStatus(status: string): string | null {
  if (status === 'sent') return 'SENT';
  if (status === 'delivered') return 'DELIVERED';
  if (status === 'read') return 'READ';
  if (status === 'failed') return 'FAILED';
  return null;
}

export async function processWhatsappWebhookJob(payload: JobPayload): Promise<void> {
  const ctx: RequestContext = {
    tenantId: payload.tenantId,
    userId: '',
    requestId: payload.requestId,
  };
  const parsed = parseWhatsappWebhook(payload.webhook);
  const account = await getAccount.execute(ctx);
  if (!account) {
    logger.warn({ tenantId: ctx.tenantId }, 'webhook_account_missing');
    return;
  }

  for (const status of parsed.statuses) {
    const mapped = mapProviderStatus(status.status);
    if (!mapped) continue;
    const updated = await updateByProvider.execute(ctx, status.wamid, { status: mapped });
    if (!updated) continue;
    if (mapped === 'DELIVERED' && updated.billable && !updated.debited) {
      const after = await appendCredit.execute(ctx, {
        kind: 'CONSUMPTION',
        amountCents: -1,
        messageId: updated.id,
      });
      if (after.balanceAfter <= 0) {
        await publish(ctx, 'messaging.credits_exhausted', { messageId: updated.id });
      } else if (after.balanceAfter <= LOW_THRESHOLD) {
        await publish(ctx, 'messaging.credits_low', {
          messageId: updated.id,
          balance: after.balanceAfter,
        });
      }
    }
  }

  for (const inbound of parsed.inbounds) {
    const phone = toE164Br(inbound.from);
    const patientId = await findPatientIdByPhone(ctx, phone);
    const conversation = await upsertConversation.execute(ctx, {
      whatsappAccountId: account.id,
      contactPhone: phone,
      patientId,
    });
    const created = await createMessage.execute(ctx, {
      conversationId: conversation.id,
      direction: 'INBOUND',
      type: inbound.type === 'button' ? 'INTERACTIVE' : 'TEXT',
      body: inbound.text ?? inbound.buttonText ?? null,
      providerMessageId: inbound.wamid,
      status: 'DELIVERED',
      relatedType: null,
      relatedId: null,
    });
    if (!created.created) continue;

    const action = parseButtonAction(inbound.buttonPayload, inbound.buttonText ?? inbound.text);
    if (action.kind === 'CONFIRM' && action.targetId) {
      await applyConfirmationFromPatient(ctx, action.targetId);
      await publish(ctx, 'messaging.confirmation_received', {
        appointmentId: action.targetId,
        wamid: inbound.wamid,
      });
    } else if (action.kind === 'CANCEL' && action.targetId) {
      await applyCancellationFromPatient(ctx, action.targetId);
      await publish(ctx, 'messaging.cancellation_received', {
        appointmentId: action.targetId,
        wamid: inbound.wamid,
      });
    } else if (action.kind === 'WAITLIST' && action.targetId) {
      await applyWaitlistAcceptByOfferId(ctx, action.targetId);
      await publish(ctx, 'messaging.waitlist_offer_accepted', {
        offerId: action.targetId,
        wamid: inbound.wamid,
      });
    } else if (action.kind === 'REBOOK') {
      await updateConversation.execute(ctx, conversation.id, 'PENDING');
    }
  }
}

async function publish(
  ctx: RequestContext,
  name: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await getTenantPrisma().runInTenantContext(ctx, async (tx) => {
    await appendOutboxEvent(tx, {
      tenantId: ctx.tenantId,
      event: { name, payload: { ...payload, requestId: ctx.requestId } },
    });
  });
}
