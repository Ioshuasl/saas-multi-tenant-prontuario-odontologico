import { AppointmentCreateData } from '@/packages/operacional/data/Appointment/AppointmentCreateData';
import type { AppointmentCreateInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentCreateService(
  appointmentSchema: AppointmentCreateInput,
  idempotencyKey?: string,
) {
  return AppointmentCreateData(appointmentSchema, idempotencyKey);
}
