import { apiClient } from '@/shared/api/api-client';
import type {
  TreatmentPlanListItem,
  TreatmentPlanListQuery,
  TreatmentPlanListResult,
} from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentPlanListData(
  query: TreatmentPlanListQuery = {},
): Promise<TreatmentPlanListResult> {
  const params = new URLSearchParams();
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.status) params.set('status', query.status);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<TreatmentPlanListItem[]>(
    `/treatment-plans${qs ? `?${qs}` : ''}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
