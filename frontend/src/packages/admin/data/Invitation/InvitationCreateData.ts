import { apiClient } from '@/shared/api/api-client';
import type { InvitationCreateFormValues } from '@/packages/admin/schemas/Invitation/InvitationSchema';
import type { InvitationSummary } from '@/packages/admin/types/Member/MemberTypes';

export async function InvitationCreateData(
  invitationSchema: InvitationCreateFormValues,
): Promise<InvitationSummary> {
  return apiClient.request<InvitationSummary>('/users/invitations', {
    method: 'POST',
    body: JSON.stringify(invitationSchema),
  });
}
