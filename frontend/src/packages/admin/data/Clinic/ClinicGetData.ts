import { apiClient } from '@/shared/api/api-client';
import type { ClinicProfile } from '@/packages/admin/types/Clinic/ClinicTypes';

export async function ClinicGetData(): Promise<ClinicProfile> {
  return apiClient.request<ClinicProfile>('/clinic');
}
