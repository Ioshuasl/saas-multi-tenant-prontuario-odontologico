import type { SupportAccessScope } from '../../../enum/support_access/support_access_scope.enum.js';
import type { SupportAccessStatus } from '../../../enum/support_access/support_access_status.enum.js';
import type { SupportAccessRow } from '../../../types/support_access/support_access.types.js';

export type SupportAccessSqlRow = {
  id: string;
  tenant_id: string;
  requester_id: string;
  approver_id: string | null;
  reason: string;
  scope: string;
  status: string;
  hours: number;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export function mapSupportAccess(row: SupportAccessSqlRow): SupportAccessRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requesterId: row.requester_id,
    approverId: row.approver_id,
    reason: row.reason,
    scope: row.scope as SupportAccessScope,
    status: row.status as SupportAccessStatus,
    hours: Number(row.hours),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
