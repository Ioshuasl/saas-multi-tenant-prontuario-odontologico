import { apiClient } from '@/shared/api/api-client';
import type { PatientDetail } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientGetData(patientId: string): Promise<PatientDetail> {
  return apiClient.request<PatientDetail>(`/patients/${patientId}`);
}
