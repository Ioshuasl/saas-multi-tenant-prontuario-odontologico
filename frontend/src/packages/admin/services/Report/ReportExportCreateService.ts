import { ReportExportCreateData } from '@/packages/admin/data/Report/ReportExportCreateData';
import type { ExportableReport } from '@/packages/admin/enum/Report/ExportableReportEnum';
import type { ReportExportCreateInput } from '@/packages/admin/types/Report/ReportTypes';

export async function ReportExportCreateService(
  report: ExportableReport,
  body: ReportExportCreateInput,
) {
  return ReportExportCreateData(report, body);
}
