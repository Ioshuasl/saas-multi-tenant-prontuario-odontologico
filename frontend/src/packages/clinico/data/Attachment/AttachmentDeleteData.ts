import { apiClient } from '@/shared/api/api-client';
import type { AttachmentDeleteFormValues } from '@/packages/clinico/schemas/Attachment/AttachmentSchema';

export async function AttachmentDeleteData(input: {
  attachmentId: string;
  attachmentSchema: AttachmentDeleteFormValues;
}): Promise<void> {
  await apiClient.request(`/attachments/${encodeURIComponent(input.attachmentId)}`, {
    method: 'DELETE',
    body: JSON.stringify(input.attachmentSchema),
  });
}
