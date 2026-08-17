import type { AuditLogListItem } from '../../../types/audit_log/audit_log_list.types.js';
import { sanitizeAuditMetadata } from '../../../helpers/audit_metadata.helper.js';

type AuditLogRow = {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  patientId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: Date;
};

export function mapAuditLog(row: AuditLogRow): AuditLogListItem {
  return {
    id: row.id,
    actorId: row.actorId,
    actorType: row.actorType,
    action: row.action,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    patientId: row.patientId,
    ipAddress: row.ipAddress,
    metadata: sanitizeAuditMetadata(row.metadata),
    createdAt: row.createdAt.toISOString(),
  };
}
