import { apiClient } from '@/shared/api/api-client';
import type { ProcedureUpdateFormValues } from '@/packages/admin/schemas/Procedure/ProcedureSchema';
import type { ProcedureSummary } from '@/packages/admin/types/Procedure/ProcedureTypes';

export async function ProcedureUpdateData(
  procedureId: string,
  procedureSchema: ProcedureUpdateFormValues,
): Promise<ProcedureSummary> {
  return apiClient.request<ProcedureSummary>(`/procedures/${procedureId}`, {
    method: 'PATCH',
    body: JSON.stringify(procedureSchema),
  });
}
