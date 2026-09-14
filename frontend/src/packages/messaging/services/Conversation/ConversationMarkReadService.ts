import { ConversationMarkReadData } from '@/packages/messaging/data/Conversation/ConversationMarkReadData';

export async function ConversationMarkReadService(conversationId: string) {
  return ConversationMarkReadData(conversationId);
}
