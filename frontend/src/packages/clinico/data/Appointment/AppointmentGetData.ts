import { apiClient } from '@/shared/api/api-client';
import type { AttendanceAppointment } from '@/packages/clinico/types/Appointment/AppointmentTypes';

export async function AppointmentGetData(appointmentId: string): Promise<AttendanceAppointment> {
  return apiClient.request<AttendanceAppointment>(`/appointments/${encodeURIComponent(appointmentId)}`);
}
