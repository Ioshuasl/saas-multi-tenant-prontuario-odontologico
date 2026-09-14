import type { TenantExportStatus } from '@/packages/admin/enum/TenantExport/TenantExportStatusEnum';

export type TenantExportCreateResult = {
  exportId: string;
  status: TenantExportStatus;
};

export type TenantExportGetResult = {
  exportId: string;
  status: TenantExportStatus;
  url: string | null;
  expiresIn: number | null;
  error: string | null;
  createdAt: string;
};
