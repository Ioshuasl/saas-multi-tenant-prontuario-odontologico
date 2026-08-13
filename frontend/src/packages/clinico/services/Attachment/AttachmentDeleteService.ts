import { AttachmentDeleteData } from '@/packages/clinico/data/Attachment/AttachmentDeleteData';
import type { AttachmentDeleteFormValues } from '@/packages/clinico/schemas/Attachment/AttachmentSchema';

export async function AttachmentDeleteService(input: {
  attachmentId: string;
  attachmentSchema: AttachmentDeleteFormValues;
}) {
  return AttachmentDeleteData(input);
}
