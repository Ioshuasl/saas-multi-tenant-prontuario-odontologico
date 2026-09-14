import { ExportCreateData } from '@/packages/admin/data/Export/ExportCreateData';
import type { ExportReport } from '@/packages/admin/enum/Report/ExportEnum';
import type { ExportCreateInput } from '@/packages/admin/types/Export/ExportTypes';

export async function ExportCreateService(report: ExportReport, exportCreateSchema: ExportCreateInput) {
  return ExportCreateData(report, exportCreateSchema);
}
