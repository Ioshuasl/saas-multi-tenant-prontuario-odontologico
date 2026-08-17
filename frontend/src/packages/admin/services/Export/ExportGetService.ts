import { ExportGetData } from '@/packages/admin/data/Export/ExportGetData';

export async function ExportGetService(exportId: string) {
  return ExportGetData(exportId);
}
