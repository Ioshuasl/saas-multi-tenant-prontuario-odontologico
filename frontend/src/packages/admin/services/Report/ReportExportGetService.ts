import { ReportExportGetData } from '@/packages/admin/data/Report/ReportExportGetData';

export async function ReportExportGetService(exportId: string) {
  return ReportExportGetData(exportId);
}
