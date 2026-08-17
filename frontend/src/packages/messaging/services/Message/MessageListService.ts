import { MessageListData } from '@/packages/messaging/data/Message/MessageListData';
import type { MessageListQuery } from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageListService(conversationId: string, query: MessageListQuery = {}) {
  return MessageListData(conversationId, query);
}
