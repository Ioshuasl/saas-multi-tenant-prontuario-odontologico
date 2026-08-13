import { WaitlistAcceptCreateData } from '@/packages/public/data/WaitlistAccept/WaitlistAcceptCreateData';

export async function WaitlistAcceptCreateService(token: string) {
  return WaitlistAcceptCreateData(token);
}
