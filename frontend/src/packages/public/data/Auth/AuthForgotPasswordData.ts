import { apiClient } from '@/shared/api/api-client';
import type { AuthForgotPasswordFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthForgotPasswordData(
  authSchema: AuthForgotPasswordFormValues,
): Promise<{ ok: true }> {
  return apiClient.request<{ ok: true }>('/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify(authSchema),
    skipAuth: true,
  });
}
