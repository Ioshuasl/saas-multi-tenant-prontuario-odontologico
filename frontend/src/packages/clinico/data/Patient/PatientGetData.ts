import { apiClient } from '@/shared/api/api-client';
import type { AttendancePatient } from '@/packages/clinico/types/Patient/PatientTypes';

export async function PatientGetData(patientId: string): Promise<AttendancePatient> {
  return apiClient.request<AttendancePatient>(`/patients/${encodeURIComponent(patientId)}`);
}
