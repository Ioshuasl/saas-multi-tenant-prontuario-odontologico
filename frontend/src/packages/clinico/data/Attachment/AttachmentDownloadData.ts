import { apiClient } from '@/shared/api/api-client';
import type { AttachmentDownloadResult } from '@/packages/clinico/types/Attachment/AttachmentTypes';

export async function AttachmentDownloadData(attachmentId: string): Promise<AttachmentDownloadResult> {
  return apiClient.request<AttachmentDownloadResult>(
    `/attachments/${encodeURIComponent(attachmentId)}/download`,
  );
}
