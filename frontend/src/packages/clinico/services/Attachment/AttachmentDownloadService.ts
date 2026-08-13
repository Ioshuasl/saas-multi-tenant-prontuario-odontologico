import { AttachmentDownloadData } from '@/packages/clinico/data/Attachment/AttachmentDownloadData';

export async function AttachmentDownloadService(attachmentId: string) {
  return AttachmentDownloadData(attachmentId);
}
