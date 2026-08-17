import { apiClient } from '@/shared/api/api-client';
import type {
  CashSession,
  CashSessionCreateInput,
} from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionCreateData(
  cashSessionCreateSchema: CashSessionCreateInput,
  idempotencyKey: string,
): Promise<CashSession> {
  return apiClient.request<CashSession>('/cash-sessions', {
    method: 'POST',
    body: JSON.stringify(cashSessionCreateSchema),
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}
