import { apiClient } from '@/shared/api/api-client';
import type { ExportReport } from '@/packages/admin/enum/Report/ExportEnum';
import type { ExportCreateInput, ExportCreateResult } from '@/packages/admin/types/Export/ExportTypes';

export async function ExportCreateData(
  report: ExportReport,
  exportCreateSchema: ExportCreateInput,
): Promise<ExportCreateResult> {
  return apiClient.request<ExportCreateResult>(`/reports/${encodeURIComponent(report)}/export`, {
    method: 'POST',
    body: JSON.stringify(exportCreateSchema),
  });
}
