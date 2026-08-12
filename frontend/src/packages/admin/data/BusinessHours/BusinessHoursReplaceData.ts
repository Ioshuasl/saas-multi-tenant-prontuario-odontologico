import { apiClient } from '@/shared/api/api-client';
import type { BusinessHoursSlot } from '@/packages/admin/types/BusinessHours/BusinessHoursTypes';

export type BusinessHoursReplaceInput = {
  unitId: string;
  professionalId?: string | null;
  slots: Array<{ weekday: number; startsAt: string; endsAt: string }>;
};

export async function BusinessHoursReplaceData(
  input: BusinessHoursReplaceInput,
): Promise<BusinessHoursSlot[]> {
  return apiClient.request<BusinessHoursSlot[]>('/clinic/business-hours', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
