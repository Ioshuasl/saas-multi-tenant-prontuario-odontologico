import { AppointmentStatusData } from '@/packages/operacional/data/Appointment/AppointmentStatusData';
import type { AppointmentStatusInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentStatusService(
  appointmentId: string,
  statusSchema: AppointmentStatusInput,
) {
  return AppointmentStatusData(appointmentId, statusSchema);
}
