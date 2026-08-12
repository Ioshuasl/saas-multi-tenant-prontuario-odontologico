import { InvitationDeleteData } from '@/packages/admin/data/Invitation/InvitationDeleteData';

export async function InvitationDeleteService(invitationId: string) {
  return InvitationDeleteData(invitationId);
}
