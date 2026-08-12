import { apiClient } from '@/shared/api/api-client';
import type { PatientCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { toPatientCreatePayload } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { PatientCreateResult } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientCreateData(
  patientSchema: PatientCreateFormValues,
): Promise<PatientCreateResult> {
  return apiClient.request<PatientCreateResult>('/patients', {
    method: 'POST',
    body: JSON.stringify(toPatientCreatePayload(patientSchema)),
  });
}
