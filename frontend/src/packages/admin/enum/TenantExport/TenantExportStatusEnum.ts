export const TenantExportStatus = {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;

export type TenantExportStatus = (typeof TenantExportStatus)[keyof typeof TenantExportStatus];
