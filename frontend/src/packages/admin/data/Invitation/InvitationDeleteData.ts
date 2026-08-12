import { apiClient } from '@/shared/api/api-client';
import type { InvitationSummary } from '@/packages/admin/types/Member/MemberTypes';

export async function InvitationDeleteData(invitationId: string): Promise<InvitationSummary> {
  return apiClient.request<InvitationSummary>(`/users/invitations/${invitationId}`, {
    method: 'DELETE',
  });
}
