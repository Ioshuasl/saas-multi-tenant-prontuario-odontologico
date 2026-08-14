import { apiClient } from '@/shared/api/api-client';
import type {
  QuoteListQuery,
  QuoteListResult,
  QuoteSummary,
} from '@/packages/operacional/types/Quote/QuoteTypes';

export async function QuoteListData(query: QuoteListQuery = {}): Promise<QuoteListResult> {
  const params = new URLSearchParams();
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.status) params.set('status', query.status);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<QuoteSummary[]>(
    `/quotes${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
