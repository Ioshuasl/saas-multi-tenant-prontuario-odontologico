import { apiClient } from '@/shared/api/api-client';
import type {
  DataSubjectRequest,
  DataSubjectRequestCreateInput,
} from '@/packages/admin/types/DataSubjectRequest/DataSubjectRequestTypes';

export async function DataSubjectRequestCreateData(
  dataSubjectRequestSchema: DataSubjectRequestCreateInput,
): Promise<DataSubjectRequest> {
  return apiClient.request<DataSubjectRequest>('/privacy/data-subject-requests', {
    method: 'POST',
    body: JSON.stringify(dataSubjectRequestSchema),
  });
}
