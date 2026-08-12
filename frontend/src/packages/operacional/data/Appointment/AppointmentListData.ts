import { apiClient } from '@/shared/api/api-client';
import type {
  AppointmentListQuery,
  AppointmentSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentListData(
  query: AppointmentListQuery,
): Promise<AppointmentSummary[]> {
  const params = new URLSearchParams();
  if (query.unitId) params.set('unitId', query.unitId);
  if (query.professionalId) params.set('professionalId', query.professionalId);
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.status) params.set('status', query.status);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  const qs = params.toString();
  return apiClient.request<AppointmentSummary[]>(`/appointments${qs ? `?${qs}` : ''}`);
}
