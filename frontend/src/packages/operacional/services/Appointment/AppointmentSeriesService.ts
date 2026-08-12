import { AppointmentSeriesCreateData } from '@/packages/operacional/data/Appointment/AppointmentSeriesCreateData';
import { AppointmentSeriesDeleteData } from '@/packages/operacional/data/Appointment/AppointmentSeriesDeleteData';
import type { SeriesDeleteScope } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';
import type { AppointmentSeriesCreateInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function AppointmentSeriesCreateService(
  seriesSchema: AppointmentSeriesCreateInput,
) {
  return AppointmentSeriesCreateData(seriesSchema);
}

export async function AppointmentSeriesDeleteService(input: {
  seriesId: string;
  scope: SeriesDeleteScope;
  appointmentId?: string;
  reason?: string;
}) {
  return AppointmentSeriesDeleteData(input);
}
