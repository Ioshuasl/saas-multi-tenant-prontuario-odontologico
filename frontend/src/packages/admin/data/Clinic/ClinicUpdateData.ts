import { apiClient } from '@/shared/api/api-client';
import type { ClinicUpdateFormValues } from '@/packages/admin/schemas/Clinic/ClinicSchema';
import type { ClinicProfile } from '@/packages/admin/types/Clinic/ClinicTypes';

export async function ClinicUpdateData(
  clinicSchema: ClinicUpdateFormValues,
): Promise<ClinicProfile> {
  return apiClient.request<ClinicProfile>('/clinic', {
    method: 'PATCH',
    body: JSON.stringify(clinicSchema),
  });
}
