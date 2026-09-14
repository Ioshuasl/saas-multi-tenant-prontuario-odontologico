import { apiClient } from '@/shared/api/api-client';
import type {
  PatientListQuery,
  PatientListResult,
  PatientSummary,
} from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientListData(query: PatientListQuery = {}): Promise<PatientListResult> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.active) params.set('active', query.active);
  if (query.cursor) params.set('cursor', query.cursor);
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<PatientSummary[]>(
    `/patients${qs ? `?${qs}` : ''}`,
  );
  const page = Number(envelope.meta?.page ?? query.page ?? 1);
  const pageSize = Number(envelope.meta?.pageSize ?? query.limit ?? 20);
  const total = Number(envelope.meta?.total ?? envelope.data.length);
  const totalPages = Number(
    envelope.meta?.totalPages ?? Math.max(1, Math.ceil(total / pageSize)),
  );

  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
    page,
    pageSize,
    total,
    totalPages,
  };
}
