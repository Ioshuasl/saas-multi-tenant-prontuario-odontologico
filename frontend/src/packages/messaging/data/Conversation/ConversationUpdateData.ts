import { apiClient } from '@/shared/api/api-client';
import type {
  ConversationPatchInput,
  ConversationSummary,
} from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationUpdateData(
  conversationId: string,
  conversationSchema: ConversationPatchInput,
): Promise<ConversationSummary> {
  return apiClient.request<ConversationSummary>(`/messaging/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify(conversationSchema),
  });
}
