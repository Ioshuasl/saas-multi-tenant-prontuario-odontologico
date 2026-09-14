import { ConversationUpdateData } from '@/packages/messaging/data/Conversation/ConversationUpdateData';
import type { ConversationPatchInput } from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationUpdateService(
  conversationId: string,
  conversationSchema: ConversationPatchInput,
) {
  return ConversationUpdateData(conversationId, conversationSchema);
}
