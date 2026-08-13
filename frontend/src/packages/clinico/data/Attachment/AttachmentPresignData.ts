import { apiClient } from '@/shared/api/api-client';
import type { AttachmentCategory } from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';
import type { AttachmentPresignResult } from '@/packages/clinico/types/Attachment/AttachmentTypes';

export async function AttachmentPresignData(input: {
  patientId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: AttachmentCategory;
}): Promise<AttachmentPresignResult> {
  return apiClient.request<AttachmentPresignResult>(
    `/patients/${encodeURIComponent(input.patientId)}/attachments/presign`,
    {
      method: 'POST',
      body: JSON.stringify({
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        category: input.category,
      }),
    },
  );
}
