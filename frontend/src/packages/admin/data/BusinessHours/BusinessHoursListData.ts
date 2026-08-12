import { apiClient } from '@/shared/api/api-client';
import type { BusinessHoursSlot } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export async function BusinessHoursListData(
  unitId: string,
  professionalId?: string | null,
): Promise<BusinessHoursSlot[]> {
  const params = new URLSearchParams({ unitId });
  if (professionalId) {
    params.set('professionalId', professionalId);
  }
  return apiClient.request<BusinessHoursSlot[]>(`/clinic/business-hours?${params.toString()}`);
}
