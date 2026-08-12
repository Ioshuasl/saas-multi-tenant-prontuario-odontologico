import { InvitationCreateData } from '@/packages/admin/data/Invitation/InvitationCreateData';
import type { InvitationCreateFormValues } from '@/packages/admin/schemas/Invitation/InvitationSchema';

export async function InvitationCreateService(invitationSchema: InvitationCreateFormValues) {
  return InvitationCreateData(invitationSchema);
}
