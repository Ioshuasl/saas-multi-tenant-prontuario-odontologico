import { apiClient } from '@/shared/api/api-client';

export type ClinicDefaultUnit = {
  id: string;
  name: string;
};

export async function ClinicDefaultUnitGetData(): Promise<ClinicDefaultUnit | null> {
  const clinic = await apiClient.request<{ defaultUnit?: ClinicDefaultUnit | null }>('/clinic');
  return clinic.defaultUnit ?? null;
}
