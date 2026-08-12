import { apiClient } from '@/shared/api/api-client';
import type { AuthResetPasswordFormValues } from '@/packages/public/schemas/Auth/AuthSchema';

export async function AuthResetPasswordData(
  authSchema: AuthResetPasswordFormValues,
): Promise<{ ok: true }> {
  return apiClient.request<{ ok: true }>('/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify(authSchema),
    skipAuth: true,
  });
}
