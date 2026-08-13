import { AccountCreateData } from '@/packages/messaging/data/Account/AccountCreateData';
import type { AccountConnectInput } from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountCreateService(accountSchema: AccountConnectInput) {
  return AccountCreateData(accountSchema);
}
