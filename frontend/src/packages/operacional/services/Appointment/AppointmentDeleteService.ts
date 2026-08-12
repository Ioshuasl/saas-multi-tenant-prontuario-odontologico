import { AppointmentDeleteData } from '@/packages/operacional/data/Appointment/AppointmentDeleteData';

export async function AppointmentDeleteService(appointmentId: string, reason: string) {
  return AppointmentDeleteData(appointmentId, reason);
}
