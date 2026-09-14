export const REPORT_EXPORT_PRESIGN_TTL_SECONDS = 900;

export function buildReportExportStorageKey(tenantId: string, exportId: string, format: 'CSV'): string {
  return `tenants/${tenantId}/exports/${exportId}.csv`;
}
