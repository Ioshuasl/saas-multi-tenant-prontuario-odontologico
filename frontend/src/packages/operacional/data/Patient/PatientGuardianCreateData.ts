import { apiClient } from '@/shared/api/api-client';
import type { GuardianCreateFormValues } from '@/packages/operacional/schemas/Patient/PatientSchema';
import { toGuardianPayload } from '@/packages/operacional/schemas/Patient/PatientSchema';
import type { LegalGuardianSummary } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientGuardianCreateData(
  patientId: string,
  guardianSchema: GuardianCreateFormValues,
): Promise<LegalGuardianSummary> {
  return apiClient.request<LegalGuardianSummary>(`/patients/${patientId}/guardians`, {
    method: 'POST',
    body: JSON.stringify(toGuardianPayload(guardianSchema)),
  });
}
