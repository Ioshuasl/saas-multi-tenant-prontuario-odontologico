import { AttachmentCreateData } from '@/packages/clinico/data/Attachment/AttachmentCreateData';
import type { AttachmentCategory } from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';

export async function AttachmentCreateService(input: {
  patientId: string;
  storageKey: string;
  checksumSha256: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: AttachmentCategory;
}) {
  return AttachmentCreateData(input);
}
