import type { AuditLog } from '@/packages/admin/types/AuditLog/AuditLogTypes';

export type AuditLogTableProps = {
  logs: AuditLog[];
  actorNames: Record<string, string>;
  patientNames: Record<string, string>;
};
