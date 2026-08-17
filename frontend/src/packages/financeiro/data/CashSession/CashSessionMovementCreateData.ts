import { apiClient } from '@/shared/api/api-client';
import type {
  CashMovement,
  CashMovementCreateInput,
} from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionMovementCreateData(
  sessionId: string,
  cashMovementCreateSchema: CashMovementCreateInput,
): Promise<CashMovement> {
  return apiClient.request<CashMovement>(
    `/cash-sessions/${encodeURIComponent(sessionId)}/movements`,
    {
      method: 'POST',
      body: JSON.stringify(cashMovementCreateSchema),
    },
  );
}
