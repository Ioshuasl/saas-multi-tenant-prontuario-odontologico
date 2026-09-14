import { InboxPatientContextGetData } from '@/packages/messaging/data/Inbox/InboxPatientContextGetData';

export async function InboxPatientContextGetService(patientId: string) {
  return InboxPatientContextGetData(patientId);
}
