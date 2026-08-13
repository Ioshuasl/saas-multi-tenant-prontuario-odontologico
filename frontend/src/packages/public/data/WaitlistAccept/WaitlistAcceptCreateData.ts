import { apiClient } from '@/shared/api/api-client';
import type { WaitlistAcceptResult } from '@/packages/public/types/WaitlistAccept/WaitlistAcceptTypes';

export async function WaitlistAcceptCreateData(token: string): Promise<WaitlistAcceptResult> {
  return apiClient.request<WaitlistAcceptResult>(
    `/public/waitlist/${encodeURIComponent(token)}/accept`,
    {
      method: 'POST',
      body: JSON.stringify({}),
      skipAuth: true,
    },
  );
}
