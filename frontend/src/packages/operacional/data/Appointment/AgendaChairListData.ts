import { apiClient } from '@/shared/api/api-client';
import type { ChairOption } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AgendaChairListData(): Promise<ChairOption[]> {
  const clinic = await apiClient.request<{ defaultUnit?: { id: string } | null }>('/clinic');
  const unitId = clinic.defaultUnit?.id;
  if (!unitId) return [];
  const rows = await apiClient.request<
    Array<{ id: string; name: string; color: string | null; active: boolean }>
  >(`/clinic/units/${unitId}/chairs`);
  return rows.filter((chair) => chair.active);
}
