import { MessageListData } from '@/packages/messaging/data/Message/MessageListData';
import type { InboxMessageListQuery } from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageListService(
  conversationId: string,
  query: InboxMessageListQuery = {},
) {
  return MessageListData(conversationId, query);
}
