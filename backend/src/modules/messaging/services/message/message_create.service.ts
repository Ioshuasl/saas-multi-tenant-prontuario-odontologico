import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { IdempotencyKeyRequiredError } from '../../models/errors/messaging.errors.js';
import { CreateAction } from '../../actions/message/message_create.action.js';
import type { ConversationMessageCreateSchema } from '../../schemas/conversation.schema.js';
import type { InboxMessage } from '../../types/message/message.types.js';

export class CreateService {
  constructor(private readonly create = new CreateAction()) {}

  execute(
    ctx: RequestContext,
    conversationId: string,
    conversationMessageSchema: ConversationMessageCreateSchema,
    idempotencyKey: string | undefined,
  ): Promise<InboxMessage> {
    const key = idempotencyKey?.trim();
    if (!key) throw new IdempotencyKeyRequiredError();
    return this.create.execute(ctx, conversationId, conversationMessageSchema, key);
  }
}
