import { AttachmentPutData } from '@/packages/clinico/data/Attachment/AttachmentPutData';

export async function AttachmentPutService(input: {
  uploadUrl: string;
  headers: Record<string, string>;
  file: File;
}) {
  return AttachmentPutData(input);
}
