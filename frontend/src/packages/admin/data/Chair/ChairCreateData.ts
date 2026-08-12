import { apiClient } from '@/shared/api/api-client';
import type { ChairCreateFormValues } from '@/packages/admin/schemas/Chair/ChairSchema';
import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';

export async function ChairCreateData(
  unitId: string,
  chairSchema: ChairCreateFormValues,
): Promise<ChairSummary> {
  return apiClient.request<ChairSummary>(`/clinic/units/${unitId}/chairs`, {
    method: 'POST',
    body: JSON.stringify(chairSchema),
  });
}
