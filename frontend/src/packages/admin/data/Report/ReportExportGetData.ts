import { apiClient } from '@/shared/api/api-client';
import type { ReportExportGetResult } from '@/packages/admin/types/Report/ReportTypes';

export async function ReportExportGetData(exportId: string): Promise<ReportExportGetResult> {
  return apiClient.request<ReportExportGetResult>(`/exports/${exportId}`);
}
