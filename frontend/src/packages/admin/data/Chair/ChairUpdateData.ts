import { apiClient } from '@/shared/api/api-client';
import type { ChairUpdateFormValues } from '@/packages/admin/schemas/Chair/ChairSchema';
import type { ChairSummary } from '@/packages/admin/types/Chair/ChairTypes';

export async function ChairUpdateData(
  unitId: string,
  chairId: string,
  chairSchema: ChairUpdateFormValues,
): Promise<ChairSummary> {
  return apiClient.request<ChairSummary>(`/clinic/units/${unitId}/chairs/${chairId}`, {
    method: 'PATCH',
    body: JSON.stringify(chairSchema),
  });
}
