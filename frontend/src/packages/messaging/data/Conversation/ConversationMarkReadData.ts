import { apiClient } from '@/shared/api/api-client';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationMarkReadData(
  conversationId: string,
): Promise<ConversationSummary> {
  return apiClient.request<ConversationSummary>(
    `/messaging/conversations/${conversationId}/read`,
    { method: 'POST', body: JSON.stringify({}) },
  );
}
