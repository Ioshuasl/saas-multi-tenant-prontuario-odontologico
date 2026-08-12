import { apiClient } from '@/shared/api/api-client';
import type { AuthSession } from '@/shared/auth/AuthTypes';
import type { AuthLoginFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthLoginData(authSchema: AuthLoginFormValues): Promise<AuthSession> {
  return apiClient.request<AuthSession>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(authSchema),
    skipAuth: true,
  });
}
