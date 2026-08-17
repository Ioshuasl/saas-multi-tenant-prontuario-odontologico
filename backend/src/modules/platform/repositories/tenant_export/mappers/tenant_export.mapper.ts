import type { TenantExportStatus } from '../../../enum/tenant_export/tenant_export_status.enum.js';
import type { TenantExportRow } from '../../../types/tenant_export/tenant_export.types.js';

type TenantExportDb = {
  id: string;
  status: string;
  storageKey: string | null;
  requestedBy: string;
  idempotencyKey: string | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function mapTenantExport(row: TenantExportDb): TenantExportRow {
  return {
    id: row.id,
    status: row.status as TenantExportStatus,
    storageKey: row.storageKey,
    requestedBy: row.requestedBy,
    idempotencyKey: row.idempotencyKey,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
