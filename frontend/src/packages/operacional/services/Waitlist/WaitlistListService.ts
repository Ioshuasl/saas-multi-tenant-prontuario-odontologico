import { WaitlistListData } from '@/packages/operacional/data/Waitlist/WaitlistListData';
import type { WaitlistListQuery } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistListService(query: WaitlistListQuery = {}) {
  return WaitlistListData(query);
}
