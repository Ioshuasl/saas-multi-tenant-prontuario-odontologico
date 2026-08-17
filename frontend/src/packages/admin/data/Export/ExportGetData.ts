import { apiClient } from '@/shared/api/api-client';
import type { ExportGetResult } from '@/packages/admin/types/Export/ExportTypes';

export async function ExportGetData(exportId: string): Promise<ExportGetResult> {
  return apiClient.request<ExportGetResult>(`/exports/${encodeURIComponent(exportId)}`);
}
