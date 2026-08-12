import { apiClient } from '@/shared/api/api-client';
import type { AuthSession } from '@/shared/auth/AuthTypes';
import type { AuthSignupFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthSignupData(authSchema: AuthSignupFormValues): Promise<AuthSession> {
  return apiClient.request<AuthSession>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(authSchema),
    skipAuth: true,
  });
}
