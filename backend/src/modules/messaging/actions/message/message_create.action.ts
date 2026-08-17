import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getMessagingProvider } from '../../../../shared/integrations/whatsapp/index.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import { findPatientIdByPhone } from '../../../patients/patients_public.js';
import {
  AccountNotConnectedError,
  AccountNotFoundError,
  ConversationNotFoundError,
  IdempotencyKeyReusedError,
  InvalidMediaError,
  KillSwitchActiveError,
  MediaNotFoundError,
  StorageUnavailableError,
} from '../../models/errors/messaging.errors.js';
import { messageSendPayloadMatches } from '../../models/message_idempotency.model.js';
import {
  MESSAGING_MEDIA_PRESIGN_TTL_SECONDS,
  isAllowedMessagingMediaMime,
  isMessagingImageMime,
  sanitizeMessagingFileName,
  storageKeyBelongsToConversation,
} from '../../helpers/messaging_storage.helper.js';
import { publishMessagingStreamEvent } from '../../helpers/messaging_stream.helper.js';
import { GetRepository as GetConversationRepository } from '../../repositories/conversation/conversation_get.repository.js';
import { TouchRepository } from '../../repositories/conversation/conversation_touch.repository.js';
import { FindByIdempotencyRepository } from '../../repositories/message/message_find_idempotency.repository.js';
import { GetRepository as GetMessageRepository } from '../../repositories/message/message_get.repository.js';
import { CreateMessageRepository } from '../../repositories/message/message.repository.js';
import { GetAccountRepository } from '../../repositories/whatsapp_account/whatsapp_account.repository.js';
import type { ConversationMessageCreateSchema } from '../../schemas/conversation.schema.js';
import type { InboxMessage } from '../../types/message/message.types.js';

function isIdempotencyConflict(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = String((err as { code?: string }).code ?? '');
  const message = String((err as { message?: string }).message ?? '');
  return code === 'P2002' || code === '23505' || message.includes('uq_message_idempotency');
}

function fileNameFromStorageKey(storageKey: string): string {
  const parts = storageKey.split('/');
  return sanitizeMessagingFileName(parts[parts.length - 1] ?? 'file');
}

export class CreateAction {
  constructor(
    private readonly getConversation = new GetConversationRepository(),
    private readonly getAccount = new GetAccountRepository(),
    private readonly findIdempotency = new FindByIdempotencyRepository(),
    private readonly createMessage = new CreateMessageRepository(),
    private readonly getMessage = new GetMessageRepository(),
    private readonly touchConversation = new TouchRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    conversationId: string,
    conversationMessageSchema: ConversationMessageCreateSchema,
    idempotencyKey: string,
  ): Promise<InboxMessage> {
    const payload = {
      text: conversationMessageSchema.text,
      mediaStorageKey: conversationMessageSchema.mediaStorageKey,
    };

    const existingByKey = await this.findIdempotency.execute(ctx, idempotencyKey);
    if (existingByKey) {
      if (!messageSendPayloadMatches(existingByKey, conversationId, payload)) {
        throw new IdempotencyKeyReusedError();
      }
      return existingByKey;
    }

    const conversation = await this.getConversation.execute(ctx, conversationId);
    if (!conversation) throw new ConversationNotFoundError();

    const account = await this.getAccount.execute(ctx);
    if (!account) throw new AccountNotFoundError();
    if (account.killSwitch) throw new KillSwitchActiveError();
    if (account.status !== 'CONNECTED') throw new AccountNotConnectedError();

    const patientId =
      conversation.patientId ?? (await findPatientIdByPhone(ctx, conversation.contactPhone));

    const text = conversationMessageSchema.text?.trim() ?? null;
    const mediaStorageKey = conversationMessageSchema.mediaStorageKey ?? null;

    let messageType = 'TEXT';
    let sent;
    try {
      if (mediaStorageKey) {
        if (!storageKeyBelongsToConversation(mediaStorageKey, ctx.tenantId, conversationId)) {
          throw new InvalidMediaError('mediaStorageKey não pertence a esta conversa.');
        }
        const head = await getObjectStorage().headObject(mediaStorageKey);
        if (!head?.contentType || !isAllowedMessagingMediaMime(head.contentType)) {
          throw new MediaNotFoundError();
        }
        const signed = await getObjectStorage().presignGet(
          mediaStorageKey,
          MESSAGING_MEDIA_PRESIGN_TTL_SECONDS,
        );
        messageType = isMessagingImageMime(head.contentType) ? 'IMAGE' : 'DOCUMENT';
        sent = await getMessagingProvider().sendMedia({
          sessionName: account.sessionName,
          to: conversation.contactPhone,
          kind: messageType === 'IMAGE' ? 'IMAGE' : 'DOCUMENT',
          fileUrl: signed.url,
          mimeType: head.contentType,
          fileName: fileNameFromStorageKey(mediaStorageKey),
          caption: text,
        });
      } else if (text) {
        sent = await getMessagingProvider().sendText({
          sessionName: account.sessionName,
          to: conversation.contactPhone,
          body: text,
        });
      } else {
        throw new InvalidMediaError('Informe text ou mediaStorageKey.');
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof ObjectStorageError) throw new StorageUnavailableError();
      const message = err instanceof Error ? err.message : 'Falha no envio WhatsApp.';
      throw new AppError('PROVIDER_UNAVAILABLE', message, 503);
    }

    try {
      const created = await this.createMessage.execute(ctx, {
        conversationId,
        direction: 'OUTBOUND',
        type: messageType,
        body: text,
        mediaKey: mediaStorageKey,
        providerMessageId: sent.providerMessageId,
        status: 'SENT',
        billable: false,
        sentBy: ctx.userId || null,
        idempotencyKey,
      });
      await this.touchConversation.execute(ctx, conversationId, {
        lastMessageAt: new Date(),
        ...(patientId && !conversation.patientId ? { patientId } : {}),
      });
      const message = await this.getMessage.execute(ctx, created.id);
      if (!message) throw new ConversationNotFoundError();

      publishMessagingStreamEvent(ctx.tenantId, {
        name: 'message_sent',
        payload: {
          conversationId,
          messageId: message.id,
          patientId: patientId ?? conversation.patientId,
        },
      });

      return message;
    } catch (err) {
      if (!isIdempotencyConflict(err)) throw err;
      const replay = await this.findIdempotency.execute(ctx, idempotencyKey);
      if (!replay) throw new IdempotencyKeyReusedError();
      if (!messageSendPayloadMatches(replay, conversationId, payload)) {
        throw new IdempotencyKeyReusedError();
      }
      return replay;
    }
  }
}
