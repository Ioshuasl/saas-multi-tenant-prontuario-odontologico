import { apiClient } from '@/shared/api/api-client';
import type { WaitlistSummary } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistDeleteData(waitlistId: string): Promise<WaitlistSummary> {
  return apiClient.request<WaitlistSummary>(`/waitlist/${waitlistId}`, {
    method: 'DELETE',
  });
}
