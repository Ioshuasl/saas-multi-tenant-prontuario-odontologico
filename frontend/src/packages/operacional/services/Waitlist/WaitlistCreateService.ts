import { WaitlistCreateData } from '@/packages/operacional/data/Waitlist/WaitlistCreateData';
import type { WaitlistCreateInput } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistCreateService(waitlistSchema: WaitlistCreateInput) {
  return WaitlistCreateData(waitlistSchema);
}
