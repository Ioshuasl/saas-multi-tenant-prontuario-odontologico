import { apiClient } from '@/shared/api/api-client';
import type { ConsentSummary } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientConsentListData(patientId: string): Promise<ConsentSummary[]> {
  return apiClient.request<ConsentSummary[]>(`/patients/${patientId}/consents`);
}
