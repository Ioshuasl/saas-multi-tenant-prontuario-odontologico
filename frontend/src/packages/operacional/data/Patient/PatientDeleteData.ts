import { apiClient } from '@/shared/api/api-client';
import type { PatientDetail } from '@/packages/operacional/types/Patient/PatientTypes';

export async function PatientDeleteData(
  patientId: string,
  confirmFutureAppointments = false,
): Promise<PatientDetail> {
  const qs = confirmFutureAppointments ? '?confirmFutureAppointments=true' : '';
  return apiClient.request<PatientDetail>(`/patients/${patientId}${qs}`, {
    method: 'DELETE',
  });
}
