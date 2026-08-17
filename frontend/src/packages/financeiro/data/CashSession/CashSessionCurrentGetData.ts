import { apiClient } from '@/shared/api/api-client';
import type { CashSession } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export async function CashSessionCurrentGetData(unitId: string): Promise<CashSession | null> {
  return apiClient.request<CashSession | null>(
    `/cash-sessions/current?unitId=${encodeURIComponent(unitId)}`,
  );
}
