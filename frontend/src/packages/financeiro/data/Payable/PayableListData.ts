import { apiClient } from '@/shared/api/api-client';
import type {
  Payable,
  PayableListQuery,
  PayableListResult,
} from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayableListData(query: PayableListQuery = {}): Promise<PayableListResult> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.dueFrom) params.set('dueFrom', query.dueFrom);
  if (query.dueTo) params.set('dueTo', query.dueTo);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<Payable[]>(`/payables${qs ? `?${qs}` : ''}`);
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
