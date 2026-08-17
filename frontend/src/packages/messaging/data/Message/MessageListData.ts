import { apiClient } from '@/shared/api/api-client';
import type {
  InboxMessage,
  MessageListQuery,
  MessageListResult,
} from '@/packages/messaging/types/Message/MessageTypes';

export async function MessageListData(
  conversationId: string,
  query: MessageListQuery = {},
): Promise<MessageListResult> {
  const params = new URLSearchParams();
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<InboxMessage[]>(
    `/messaging/conversations/${encodeURIComponent(conversationId)}/messages${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
