import { ConversationUpdateData } from '@/packages/messaging/data/Conversation/ConversationUpdateData';
import type { ConversationUpdateInput } from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationUpdateService(
  conversationId: string,
  conversationUpdateSchema: ConversationUpdateInput,
) {
  return ConversationUpdateData(conversationId, conversationUpdateSchema);
}
