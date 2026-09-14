import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { ConversationNotFoundError } from '../../models/errors/messaging.errors.js';
import { ReadRepository } from '../../repositories/conversation/conversation_read.repository.js';
import type { ConversationSummary } from '../../types/conversation/conversation.types.js';

export class ReadService {
  constructor(private readonly read = new ReadRepository()) {}

  async execute(ctx: RequestContext, conversationId: string): Promise<ConversationSummary> {
    const conversation = await this.read.execute(ctx, conversationId);
    if (!conversation) throw new ConversationNotFoundError();
    return conversation;
  }
}
