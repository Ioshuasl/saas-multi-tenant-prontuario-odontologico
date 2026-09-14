/** Superfície HTTP transversal (auditoria / LGPD). Gravação de audit permanece em shared/database/write_audit. */
export type { AuditLogListItem, AuditLogListResult } from './types/audit_log/audit_log_list.types.js';
export type {
  TenantExportCreateResult,
  TenantExportGetResult,
} from './types/tenant_export/tenant_export.types.js';
export type {
  DataSubjectRequestView,
  DataSubjectRequestListResult,
} from './types/data_subject_request/data_subject_request.types.js';
export type { SupportAccessRow } from './types/support_access/support_access.types.js';
export { SUPPORT_GRANT_PERMISSIONS } from './enum/support_access/support_access_scope.enum.js';

import { GetUsableRepository } from './repositories/support_access/support_access_get_usable.repository.js';
import type { SupportAccessRow } from './types/support_access/support_access.types.js';

const getUsableGrant = new GetUsableRepository();

/** Grant APPROVED, não expirado, requester = ator, tenant = header. */
export async function findUsableSupportGrant(input: {
  grantId: string;
  tenantId: string;
  requesterId: string;
}): Promise<SupportAccessRow | null> {
  return getUsableGrant.execute(input);
}
