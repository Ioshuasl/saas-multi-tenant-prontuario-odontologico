import { apiClient } from '@/shared/api/api-client';
import type { PatientTimelineResult } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientTimelineGetData(patientId: string): Promise<PatientTimelineResult> {
  return apiClient.request<PatientTimelineResult>(`/patients/${patientId}/timeline`);
}
