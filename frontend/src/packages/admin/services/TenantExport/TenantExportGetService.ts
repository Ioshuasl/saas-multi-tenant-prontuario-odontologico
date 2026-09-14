import { TenantExportGetData } from '@/packages/admin/data/TenantExport/TenantExportGetData';

export async function TenantExportGetService(exportId: string) {
  return TenantExportGetData(exportId);
}
