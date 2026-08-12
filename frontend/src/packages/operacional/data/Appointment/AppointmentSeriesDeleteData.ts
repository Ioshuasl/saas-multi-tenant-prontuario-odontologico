import { apiClient } from '@/shared/api/api-client';
import type { SeriesDeleteScope } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';

export async function AppointmentSeriesDeleteData(input: {
  seriesId: string;
  scope: SeriesDeleteScope;
  appointmentId?: string;
  reason?: string;
}): Promise<{ seriesId: string; scope: string; cancelledCount: number }> {
  const params = new URLSearchParams({ scope: input.scope });
  if (input.appointmentId) params.set('appointmentId', input.appointmentId);
  if (input.reason) params.set('reason', input.reason);
  return apiClient.request(`/appointment-series/${input.seriesId}?${params}`, {
    method: 'DELETE',
  });
}
