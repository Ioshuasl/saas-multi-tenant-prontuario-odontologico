import { apiClient } from '@/shared/api/api-client';
import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';

export async function ChairListData(unitId: string): Promise<ChairSummary[]> {
  return apiClient.request<ChairSummary[]>(`/clinic/units/${unitId}/chairs`);
}
