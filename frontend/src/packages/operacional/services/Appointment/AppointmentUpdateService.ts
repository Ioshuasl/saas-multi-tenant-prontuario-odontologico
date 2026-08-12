import { AppointmentUpdateData } from '@/packages/operacional/data/Appointment/AppointmentUpdateData';
import type { AppointmentUpdateInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentUpdateService(
  appointmentId: string,
  appointmentSchema: AppointmentUpdateInput,
) {
  return AppointmentUpdateData(appointmentId, appointmentSchema);
}
