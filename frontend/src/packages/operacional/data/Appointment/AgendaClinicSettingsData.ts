import { apiClient } from '@/shared/api/api-client';

export type AgendaClinicSettings = {
  chairsEnabled: boolean;
};

export async function AgendaClinicSettingsData(): Promise<AgendaClinicSettings> {
  const clinic = await apiClient.request<{ chairsEnabled?: boolean }>('/clinic');
  return { chairsEnabled: clinic.chairsEnabled === true };
}
