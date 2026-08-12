import { apiClient } from '@/shared/api/api-client';
import type { ProcedureCreateFormValues } from '@/packages/admin/schemas/Procedure/ProcedureSchema';
import type { ProcedureSummary } from '@/packages/admin/types/Procedure/ProcedureTypes';

export async function ProcedureCreateData(
  procedureSchema: ProcedureCreateFormValues,
): Promise<ProcedureSummary> {
  return apiClient.request<ProcedureSummary>('/procedures', {
    method: 'POST',
    body: JSON.stringify(procedureSchema),
  });
}
