import { apiClient } from '@/shared/api/api-client';
import type { TenantExportGetResult } from '@/packages/admin/types/TenantExport/TenantExportTypes';

export async function TenantExportGetData(exportId: string): Promise<TenantExportGetResult> {
  return apiClient.request<TenantExportGetResult>(
    `/privacy/exports/${encodeURIComponent(exportId)}`,
  );
}
