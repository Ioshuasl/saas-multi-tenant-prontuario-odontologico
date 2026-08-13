import { AttachmentListData } from '@/packages/clinico/data/Attachment/AttachmentListData';

export async function AttachmentListService(patientId: string) {
  return AttachmentListData(patientId);
}
