import { apiClient } from '@/shared/api/api-client';
import type { ProcedureOption } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function ProcedureListData(): Promise<ProcedureOption[]> {
  return apiClient.request<ProcedureOption[]>('/procedures');
}
