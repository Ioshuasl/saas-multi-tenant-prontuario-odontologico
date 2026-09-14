import { apiClient } from '@/shared/api/api-client';
import type { DataSubjectRequest } from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestGetData(id: string): Promise<DataSubjectRequest> {
  return apiClient.request<DataSubjectRequest>(
    `/privacy/data-subject-requests/${encodeURIComponent(id)}`,
  );
}
