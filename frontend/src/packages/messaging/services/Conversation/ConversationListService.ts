import { ConversationListData } from '@/packages/messaging/data/Conversation/ConversationListData';
import type { ConversationListQuery } from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationListService(query: ConversationListQuery = {}) {
  return ConversationListData(query);
}
