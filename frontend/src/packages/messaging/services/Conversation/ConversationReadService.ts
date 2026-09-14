import { ConversationReadData } from '@/packages/messaging/data/Conversation/ConversationReadData';

export async function ConversationReadService(conversationId: string) {
  return ConversationReadData(conversationId);
}
