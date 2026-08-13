import { AccountUpdateData } from '@/packages/messaging/data/Account/AccountUpdateData';
import type { AccountPatchInput } from '@/packages/messaging/types/Account/AccountTypes';

export async function AccountUpdateService(accountSchema: AccountPatchInput) {
  return AccountUpdateData(accountSchema);
}
