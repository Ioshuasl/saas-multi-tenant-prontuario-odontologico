import { apiClient } from '@/shared/api/api-client';
import type {
  Installment,
  InstallmentListQuery,
  InstallmentListResult,
} from '@/packages/financeiro/types/Installment/InstallmentTypes';

export async function InstallmentListData(
  query: InstallmentListQuery = {},
): Promise<InstallmentListResult> {
  const params = new URLSearchParams();
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.status) params.set('status', query.status);
  if (query.dueFrom) params.set('dueFrom', query.dueFrom);
  if (query.dueTo) params.set('dueTo', query.dueTo);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<Installment[]>(
    `/installments${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
