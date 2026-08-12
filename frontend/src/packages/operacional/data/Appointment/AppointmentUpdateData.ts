import { apiClient } from '@/shared/api/api-client';
import type {
  AppointmentSummary,
  AppointmentUpdateInput,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentUpdateData(
  appointmentId: string,
  appointmentSchema: AppointmentUpdateInput,
): Promise<AppointmentSummary> {
  return apiClient.request<AppointmentSummary>(`/appointments/${appointmentId}`, {
    method: 'PATCH',
    body: JSON.stringify(appointmentSchema),
  });
}
