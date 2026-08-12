import { apiClient } from '@/shared/api/api-client';
import type {
  ScheduleBlockCreateInput,
  ScheduleBlockSummary,
} from '@/packages/operacional/types/Appointment/AppointmentTypes';

export async function ScheduleBlockCreateData(
  blockSchema: ScheduleBlockCreateInput,
): Promise<ScheduleBlockSummary> {
  return apiClient.request<ScheduleBlockSummary>('/schedule-blocks', {
    method: 'POST',
    body: JSON.stringify(blockSchema),
  });
}
