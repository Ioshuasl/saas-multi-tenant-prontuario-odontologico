import { CashSessionMovementCreateData } from '@/packages/financeiro/data/CashSession/CashSessionMovementCreateData';
import type { CashMovementCreateInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionMovementCreateService(
  sessionId: string,
  cashMovementCreateSchema: CashMovementCreateInput,
) {
  return CashSessionMovementCreateData(sessionId, cashMovementCreateSchema);
}
