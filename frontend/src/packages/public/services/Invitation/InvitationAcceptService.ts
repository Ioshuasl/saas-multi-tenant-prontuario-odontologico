import { InvitationAcceptData } from '@/packages/public/data/Invitation/InvitationAcceptData';
import type { InvitationAcceptFormValues } from '@/packages/public/schemas/Invitation/InvitationSchema';

export async function InvitationAcceptService(invitationSchema: InvitationAcceptFormValues) {
  return InvitationAcceptData(invitationSchema);
}
