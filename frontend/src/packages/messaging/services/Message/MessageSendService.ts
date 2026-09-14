import { MessageSendData } from '@/packages/messaging/data/Message/MessageSendData';
import type { MessageSendInput } from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageSendService(
  conversationId: string,
  messageSchema: MessageSendInput,
  idempotencyKey: string,
) {
  return MessageSendData(conversationId, messageSchema, idempotencyKey);
}
