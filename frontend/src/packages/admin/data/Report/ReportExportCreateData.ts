import { apiClient } from '@/shared/api/api-client';
import type { ExportableReport } from '@/packages/admin/enum/Report/ExportableReportEnum';
import type {
  ReportExportCreateInput,
  ReportExportCreateResult,
} from '@/packages/admin/types/Report/ReportTypes';

export async function ReportExportCreateData(
  report: ExportableReport,
  body: ReportExportCreateInput,
): Promise<ReportExportCreateResult> {
  return apiClient.request<ReportExportCreateResult>(`/reports/${report}/export`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
