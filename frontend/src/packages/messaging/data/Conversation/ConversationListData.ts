import { apiClient } from '@/shared/api/api-client';
import type {
  ConversationListQuery,
  ConversationListResult,
  ConversationSummary,
} from '@/packages/messaging/types/Conversation/ConversationTypes';

export async function ConversationListData(
  query: ConversationListQuery = {},
): Promise<ConversationListResult> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.unread !== undefined) params.set('unread', String(query.unread));
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<ConversationSummary[]>(
    `/messaging/conversations${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
