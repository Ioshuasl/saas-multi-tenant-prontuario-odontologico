import { AuditLogListData } from '@/packages/admin/data/AuditLog/AuditLogListData';
import type { AuditLogListQuery } from '@/packages/admin/types/AuditLog/AuditLogTypes';

export async function AuditLogListService(query: AuditLogListQuery = {}) {
  return AuditLogListData(query);
}
