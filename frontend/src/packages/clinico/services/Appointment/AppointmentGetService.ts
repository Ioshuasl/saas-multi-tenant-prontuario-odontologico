import { AppointmentGetData } from '@/packages/clinico/data/Appointment/AppointmentGetData';

export async function AppointmentGetService(appointmentId: string) {
  return AppointmentGetData(appointmentId);
}
