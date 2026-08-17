import { apiClient } from '@/shared/api/api-client';
import type {
  DataSubjectRequest,
  DataSubjectRequestUpdateInput,
} from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestUpdateData(
  id: string,
  dataSubjectRequestSchema: DataSubjectRequestUpdateInput,
): Promise<DataSubjectRequest> {
  return apiClient.request<DataSubjectRequest>(
    `/privacy/data-subject-requests/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(dataSubjectRequestSchema),
    },
  );
}
