import { apiClient } from '@/shared/api/api-client';
import type {
  AppointmentStatusInput,
  AppointmentSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentStatusData(
  appointmentId: string,
  statusSchema: AppointmentStatusInput,
): Promise<AppointmentSummary> {
  return apiClient.request<AppointmentSummary>(`/appointments/${appointmentId}/status`, {
    method: 'POST',
    body: JSON.stringify(statusSchema),
  });
}
