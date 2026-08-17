import { apiClient } from '@/shared/api/api-client';
import type {
  AuditLogPatientListResult,
  AuditLogPatientOption,
} from '@/packages/admin/types/AuditLog/AuditLogTypes';

export async function AuditLogPatientListData(
  search = '',
): Promise<AuditLogPatientListResult> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', '50');
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<AuditLogPatientOption[]>(`/patients?${qs}`);
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
