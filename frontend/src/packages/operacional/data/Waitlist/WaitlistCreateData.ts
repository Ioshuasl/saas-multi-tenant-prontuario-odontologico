import { apiClient } from '@/shared/api/api-client';
import type { WaitlistCreateInput, WaitlistSummary } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistCreateData(waitlistSchema: WaitlistCreateInput): Promise<WaitlistSummary> {
  return apiClient.request<WaitlistSummary>('/waitlist', {
    method: 'POST',
    body: JSON.stringify(waitlistSchema),
  });
}
