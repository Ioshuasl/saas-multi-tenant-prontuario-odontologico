import { apiClient } from '@/shared/api/api-client';
import type { TenantExportCreateResult } from '@/packages/admin/types/TenantExport/TenantExportTypes';

export async function TenantExportCreateData(): Promise<TenantExportCreateResult> {
  return apiClient.request<TenantExportCreateResult>('/privacy/exports', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
