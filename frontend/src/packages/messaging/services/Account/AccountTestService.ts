import { AccountTestData } from '@/packages/messaging/data/Account/AccountTestData';
import type { AccountTestInput } from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountTestService(accountSchema: AccountTestInput) {
  return AccountTestData(accountSchema);
}
