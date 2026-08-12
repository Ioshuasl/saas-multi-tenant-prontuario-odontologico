import { AppointmentListData } from '@/packages/operacional/data/Appointment/AppointmentListData';
import type { AppointmentListQuery } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentListService(query: AppointmentListQuery) {
  return AppointmentListData(query);
}
