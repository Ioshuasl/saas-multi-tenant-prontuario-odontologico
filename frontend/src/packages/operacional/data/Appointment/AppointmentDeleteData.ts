import { apiClient } from '@/shared/api/api-client';
import type { AppointmentSummary } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentDeleteData(
  appointmentId: string,
  reason: string,
): Promise<AppointmentSummary> {
  return apiClient.request<AppointmentSummary>(`/appointments/${appointmentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}
