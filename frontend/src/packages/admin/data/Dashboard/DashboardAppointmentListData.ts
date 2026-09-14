import { apiClient } from '@/shared/api/api-client';
import type {
  DashboardAppointmentListQuery,
  DashboardAppointmentSummary,
} from '@/packages/admin/types/Dashboard/DashboardAppointmentTypes';

export async function DashboardAppointmentListData(
  query: DashboardAppointmentListQuery,
): Promise<DashboardAppointmentSummary[]> {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  return apiClient.request<DashboardAppointmentSummary[]>(`/appointments?${params.toString()}`);
}
