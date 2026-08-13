import { AttachmentPresignData } from '@/packages/clinico/data/Attachment/AttachmentPresignData';
import type { AttachmentCategory } from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';

export async function AttachmentPresignService(input: {
  patientId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: AttachmentCategory;
}) {
  return AttachmentPresignData(input);
}
