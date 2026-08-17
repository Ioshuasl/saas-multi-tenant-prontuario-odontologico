import { ConversationGetData } from '@/packages/messaging/data/Conversation/ConversationGetData';

export async function ConversationGetService(conversationId: string) {
  return ConversationGetData(conversationId);
}
