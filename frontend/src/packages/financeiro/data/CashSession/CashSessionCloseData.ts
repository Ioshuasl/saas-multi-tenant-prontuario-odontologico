import { apiClient } from '@/shared/api/api-client';
import type {
  CashSession,
  CashSessionCloseInput,
} from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionCloseData(
  sessionId: string,
  cashSessionCloseSchema: CashSessionCloseInput,
  idempotencyKey: string,
): Promise<CashSession> {
  return apiClient.request<CashSession>(
    `/cash-sessions/${encodeURIComponent(sessionId)}/close`,
    {
      method: 'POST',
      body: JSON.stringify(cashSessionCloseSchema),
      headers: { 'Idempotency-Key': idempotencyKey },
    },
  );
}
