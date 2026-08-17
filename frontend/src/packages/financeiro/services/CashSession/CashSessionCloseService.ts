import { CashSessionCloseData } from '@/packages/financeiro/data/CashSession/CashSessionCloseData';
import type { CashSessionCloseInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionCloseService(
  sessionId: string,
  cashSessionCloseSchema: CashSessionCloseInput,
  idempotencyKey: string,
) {
  return CashSessionCloseData(sessionId, cashSessionCloseSchema, idempotencyKey);
}
