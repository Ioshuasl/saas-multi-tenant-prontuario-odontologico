import { apiClient } from '@/shared/api/api-client';
import type { AttachmentCategory } from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';
import type { AttachmentSummary } from '@/packages/clinico/types/Attachment/AttachmentTypes';

export async function AttachmentCreateData(input: {
  patientId: string;
  storageKey: string;
  checksumSha256: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: AttachmentCategory;
}): Promise<AttachmentSummary> {
  return apiClient.request<AttachmentSummary>(
    `/patients/${encodeURIComponent(input.patientId)}/attachments`,
    {
      method: 'POST',
      body: JSON.stringify({
        storageKey: input.storageKey,
        checksumSha256: input.checksumSha256,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        category: input.category,
      }),
    },
  );
}
