import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import {
  ConversationNotFoundError,
  InvalidMediaError,
  StorageUnavailableError,
} from '../../models/errors/messaging.errors.js';
import {
  MESSAGING_MEDIA_PRESIGN_TTL_SECONDS,
  MAX_MESSAGING_MEDIA_BYTES,
  buildMessagingMediaStorageKey,
  isAllowedMessagingMediaMime,
} from '../../helpers/messaging_storage.helper.js';
import { GetRepository as GetConversationRepository } from '../../repositories/conversation/conversation_get.repository.js';
import type { ConversationMediaPresignSchema } from '../../schemas/conversation.schema.js';
import type { ConversationMediaPresignResult } from '../../types/conversation/conversation.types.js';

export class PresignService {
  constructor(private readonly getConversation = new GetConversationRepository()) {}

  async execute(
    ctx: RequestContext,
    conversationId: string,
    conversationMediaSchema: ConversationMediaPresignSchema,
  ): Promise<ConversationMediaPresignResult> {
    if (!isAllowedMessagingMediaMime(conversationMediaSchema.mimeType)) {
      throw new InvalidMediaError('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou PDF.');
    }
    if (conversationMediaSchema.sizeBytes > MAX_MESSAGING_MEDIA_BYTES) {
      throw new InvalidMediaError('Arquivo excede o limite de 20 MB.');
    }

    const conversation = await this.getConversation.execute(ctx, conversationId);
    if (!conversation) throw new ConversationNotFoundError();

    const storageKey = buildMessagingMediaStorageKey({
      tenantId: ctx.tenantId,
      conversationId,
      objectId: idGenerator.next(),
      fileName: conversationMediaSchema.fileName,
      mimeType: conversationMediaSchema.mimeType,
    });

    try {
      const signed = await getObjectStorage().presignPut(
        storageKey,
        conversationMediaSchema.mimeType,
        MESSAGING_MEDIA_PRESIGN_TTL_SECONDS,
      );
      return {
        uploadUrl: signed.url,
        method: 'PUT',
        headers: signed.headers,
        storageKey,
        expiresIn: MESSAGING_MEDIA_PRESIGN_TTL_SECONDS,
      };
    } catch (err) {
      if (err instanceof ObjectStorageError) throw new StorageUnavailableError();
      throw err;
    }
  }
}
