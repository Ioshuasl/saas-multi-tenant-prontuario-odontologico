import { WaitlistOfferData } from '@/packages/operacional/data/Waitlist/WaitlistOfferData';
import type { WaitlistOfferInput } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistOfferService(waitlistSchema: WaitlistOfferInput) {
  return WaitlistOfferData(waitlistSchema);
}
