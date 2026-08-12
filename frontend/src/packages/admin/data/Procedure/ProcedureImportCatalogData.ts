import { apiClient } from '@/shared/api/api-client';
import type { ProcedureImportCatalogResult } from '@/packages/admin/types/Procedure/ProcedureTypes';

export async function ProcedureImportCatalogData(): Promise<ProcedureImportCatalogResult> {
  return apiClient.request<ProcedureImportCatalogResult>('/procedures/import-catalog', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
