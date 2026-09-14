import { MessageCreateData } from '@/packages/messaging/data/Message/MessageCreateData';
import type { MessageCreateInput } from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageCreateService(
  conversationId: string,
  messageCreateSchema: MessageCreateInput,
  idempotencyKey: string,
) {
  return MessageCreateData(conversationId, messageCreateSchema, idempotencyKey);
}
