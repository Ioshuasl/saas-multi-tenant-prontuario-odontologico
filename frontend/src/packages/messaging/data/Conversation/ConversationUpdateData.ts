import { apiClient } from '@/shared/api/api-client';
import type {
  ConversationSummary,
  ConversationUpdateInput,
} from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationUpdateData(
  conversationId: string,
  conversationUpdateSchema: ConversationUpdateInput,
): Promise<ConversationSummary> {
  return apiClient.request<ConversationSummary>(
    `/messaging/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(conversationUpdateSchema),
    },
  );
}
