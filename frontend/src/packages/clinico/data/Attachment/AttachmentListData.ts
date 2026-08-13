import { apiClient } from '@/shared/api/api-client';
import type { AttachmentSummary } from '@/packages/clinico/types/Attachment/AttachmentTypes';

export async function AttachmentListData(patientId: string): Promise<AttachmentSummary[]> {
  const result = await apiClient.request<{ items: AttachmentSummary[] }>(
    `/patients/${encodeURIComponent(patientId)}/attachments`,
  );
  return result.items;
}
