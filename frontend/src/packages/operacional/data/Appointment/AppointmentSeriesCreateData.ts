import { apiClient } from '@/shared/api/api-client';
import type {
  AppointmentSeriesCreateInput,
  AppointmentSeriesSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentSeriesCreateData(
  seriesSchema: AppointmentSeriesCreateInput,
): Promise<AppointmentSeriesSummary> {
  return apiClient.request<AppointmentSeriesSummary>('/appointment-series', {
    method: 'POST',
    body: JSON.stringify(seriesSchema),
  });
}
