import { apiClient } from '@/shared/api/api-client';
import type { ConversationDetail } from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationGetData(conversationId: string): Promise<ConversationDetail> {
  return apiClient.request<ConversationDetail>(
    `/messaging/conversations/${encodeURIComponent(conversationId)}`,
  );
}
