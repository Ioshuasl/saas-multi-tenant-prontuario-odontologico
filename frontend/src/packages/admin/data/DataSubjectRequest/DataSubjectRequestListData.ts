import { apiClient } from '@/shared/api/api-client';
import type {
  DataSubjectRequestListQuery,
  DataSubjectRequestListResult,
} from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestListData(
  query: DataSubjectRequestListQuery = {},
): Promise<DataSubjectRequestListResult> {
  const params = new URLSearchParams();
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.status) params.set('status', query.status);
  if (query.type) params.set('type', query.type);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiClient.request<DataSubjectRequestListResult>(
    `/privacy/data-subject-requests${qs ? `?${qs}` : ''}`,
  );
}
