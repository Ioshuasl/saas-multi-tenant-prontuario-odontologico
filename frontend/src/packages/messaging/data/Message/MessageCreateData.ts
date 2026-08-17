import { apiClient } from '@/shared/api/api-client';
import type { InboxMessage, MessageCreateInput } from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageCreateData(
  conversationId: string,
  messageCreateSchema: MessageCreateInput,
  idempotencyKey: string,
): Promise<InboxMessage> {
  return apiClient.request<InboxMessage>(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      body: JSON.stringify(messageCreateSchema),
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}
