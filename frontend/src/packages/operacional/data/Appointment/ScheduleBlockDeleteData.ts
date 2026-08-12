import { apiClient } from '@/shared/api/api-client';

export async function ScheduleBlockDeleteData(blockId: string): Promise<{ id: string }> {
  return apiClient.request<{ id: string }>(`/schedule-blocks/${blockId}`, {
    method: 'DELETE',
  });
}
