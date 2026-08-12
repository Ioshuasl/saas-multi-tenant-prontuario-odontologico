import { apiClient } from '@/shared/api/api-client';
import type { ProfessionalOption } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AgendaProfessionalListData(): Promise<ProfessionalOption[]> {
  const rows = await apiClient.request<
    Array<{ id: string; name: string; color: string | null; active: boolean }>
  >('/clinic/professionals');
  return rows.filter((p) => p.active);
}
