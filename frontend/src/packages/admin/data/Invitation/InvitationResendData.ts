import { apiClient } from '@/shared/api/api-client';
import type { InvitationSummary } from '@/packages/admin/types/Member/MemberTypes';

export async function InvitationResendData(invitationId: string): Promise<InvitationSummary> {
  return apiClient.request<InvitationSummary>(`/users/invitations/${invitationId}/resend`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
