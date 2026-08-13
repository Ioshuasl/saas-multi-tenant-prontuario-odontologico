import { WaitlistDeleteData } from '@/packages/operacional/data/Waitlist/WaitlistDeleteData';

export async function WaitlistDeleteService(waitlistId: string) {
  return WaitlistDeleteData(waitlistId);
}
