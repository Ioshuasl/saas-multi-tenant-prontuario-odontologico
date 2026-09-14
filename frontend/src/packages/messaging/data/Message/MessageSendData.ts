import { apiClient } from '@/shared/api/api-client';
import type { InboxMessage, MessageSendInput } from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageSendData(
  conversationId: string,
  messageSchema: MessageSendInput,
  idempotencyKey: string,
): Promise<InboxMessage> {
  return apiClient.request<InboxMessage>(`/messaging/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(messageSchema),
  });
}
