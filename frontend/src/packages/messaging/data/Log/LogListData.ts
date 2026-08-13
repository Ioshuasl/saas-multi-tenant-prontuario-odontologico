import { apiClient } from '@/shared/api/api-client';
import type { MessageLogItem, MessageLogListQuery, MessageLogListResult } from '@/packages/messaging/types/Log/LogTypes';

export async function LogListData(query: MessageLogListQuery = {}): Promise<MessageLogListResult> {
  const params = new URLSearchParams();
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.result) params.set('result', query.result);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<MessageLogItem[]>(
    `/messaging/logs${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
