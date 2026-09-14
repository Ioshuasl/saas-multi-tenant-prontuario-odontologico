import { DashboardAppointmentListData } from '@/packages/admin/data/Dashboard/DashboardAppointmentListData';
import type { DashboardAppointmentListQuery } from '@/packages/admin/types/Dashboard/DashboardAppointmentTypes';

export async function DashboardAppointmentListService(query: DashboardAppointmentListQuery) {
  return DashboardAppointmentListData(query);
}
