import { apiClient } from '@/shared/api/api-client';
import type { ConversationSummary } from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationReadData(conversationId: string): Promise<ConversationSummary> {
  return apiClient.request<ConversationSummary>(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: 'POST' },
  );
}
