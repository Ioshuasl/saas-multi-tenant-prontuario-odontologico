import type { TenantExportStatus } from '../../enum/tenant_export/tenant_export_status.enum.js';

export type TenantExportRow = {
  id: string;
  status: TenantExportStatus;
  storageKey: string | null;
  requestedBy: string;
  idempotencyKey: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export type TenantExportAttachmentMeta = {
  id: string;
  patientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  zipPath: string;
  missing?: boolean;
};
