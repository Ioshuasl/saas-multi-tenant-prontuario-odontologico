export const TENANT_EXPORT_STATUSES = ['PENDING', 'RUNNING', 'READY', 'FAILED'] as const;

export type TenantExportStatus = (typeof TENANT_EXPORT_STATUSES)[number];
