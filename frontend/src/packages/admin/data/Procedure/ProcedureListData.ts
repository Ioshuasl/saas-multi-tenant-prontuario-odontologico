import { apiClient } from '@/shared/api/api-client';
import type { ProcedureSummary } from '@/packages/admin/types/Procedure/ProcedureTypes';

export async function ProcedureListData(): Promise<ProcedureSummary[]> {
  return apiClient.request<ProcedureSummary[]>('/procedures');
}
