import { ScheduleBlockCreateData } from '@/packages/operacional/data/Appointment/ScheduleBlockCreateData';
import type { ScheduleBlockCreateInput } from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function ScheduleBlockCreateService(blockSchema: ScheduleBlockCreateInput) {
  return ScheduleBlockCreateData(blockSchema);
}
