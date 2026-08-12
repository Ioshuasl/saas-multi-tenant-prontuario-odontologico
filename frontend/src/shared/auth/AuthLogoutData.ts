import { apiClient } from '@/shared/api/api-client';

export async function AuthLogoutData(): Promise<{ ok: true }> {
  return apiClient.request<{ ok: true }>('/auth/logout', {
    method: 'POST',
  });
}
