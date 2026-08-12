import { apiClient } from '@/shared/api/api-client';
import type { ConsentCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { ConsentSummary } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientConsentCreateData(
  patientId: string,
  consentSchema: ConsentCreateFormValues,
): Promise<ConsentSummary> {
  return apiClient.request<ConsentSummary>(`/patients/${patientId}/consents`, {
    method: 'POST',
    body: JSON.stringify(consentSchema),
  });
}
