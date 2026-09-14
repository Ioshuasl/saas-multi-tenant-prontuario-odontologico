import { AuditLogPatientListData } from '@/packages/admin/data/AuditLog/AuditLogPatientListData';

export async function AuditLogPatientListService(search = '') {
  return AuditLogPatientListData(search);
}
