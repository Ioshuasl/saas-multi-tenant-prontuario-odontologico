import { apiClient } from '@/shared/api/api-client';
import type {
  PatientListQuery,
  PatientListResult,
  PatientSummary,
} from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientListData(query: PatientListQuery = {}): Promise<PatientListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.active) params.set('active', query.active);
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<PatientSummary[]>(
    `/patients${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
