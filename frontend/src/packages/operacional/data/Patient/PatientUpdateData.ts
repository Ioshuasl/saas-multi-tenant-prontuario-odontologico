import { apiClient } from '@/shared/api/api-client';
import type { PatientUpdateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { toPatientUpdatePayload } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { PatientDetail } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientUpdateData(
  patientId: string,
  patientSchema: PatientUpdateFormValues,
): Promise<PatientDetail> {
  return apiClient.request<PatientDetail>(`/patients/${patientId}`, {
    method: 'PATCH',
    body: JSON.stringify(toPatientUpdatePayload(patientSchema)),
  });
}
