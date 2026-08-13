import { apiClient } from '@/shared/api/api-client';
import type { WaitlistOfferInput, WaitlistOfferResult } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistOfferData(
  waitlistSchema: WaitlistOfferInput,
): Promise<WaitlistOfferResult> {
  return apiClient.request<WaitlistOfferResult>(`/waitlist/${waitlistSchema.waitlistId}/offer`, {
    method: 'POST',
    body: JSON.stringify({ appointmentId: waitlistSchema.appointmentId }),
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  });
}
