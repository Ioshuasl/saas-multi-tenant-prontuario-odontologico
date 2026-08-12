import { InvitationResendData } from '@/packages/admin/data/Invitation/InvitationResendData';

export async function InvitationResendService(invitationId: string) {
  return InvitationResendData(invitationId);
}
