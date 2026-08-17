import { CashSessionCreateData } from '@/packages/financeiro/data/CashSession/CashSessionCreateData';
import type { CashSessionCreateInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionCreateService(
  cashSessionCreateSchema: CashSessionCreateInput,
  idempotencyKey: string,
) {
  return CashSessionCreateData(cashSessionCreateSchema, idempotencyKey);
}
