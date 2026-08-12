import { apiClient } from '@/shared/api/api-client';
import type { AuthSession } from '@/shared/auth/AuthTypes';
import type { InvitationAcceptFormValues } from '@/packages/public/schemas/Invitation/InvitationSchema';

export async function InvitationAcceptData(
  invitationSchema: InvitationAcceptFormValues,
): Promise<AuthSession> {
  return apiClient.request<AuthSession>('/users/invitations/accept', {
    method: 'POST',
    body: JSON.stringify(invitationSchema),
    skipAuth: true,
  });
}
