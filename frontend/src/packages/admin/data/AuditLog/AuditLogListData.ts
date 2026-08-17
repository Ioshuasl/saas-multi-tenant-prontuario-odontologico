import { apiClient } from '@/shared/api/api-client';
import type {
  AuditLogListQuery,
  AuditLogListResult,
} from '@/packages/admin/types/AuditLog/AuditLogTypes';

export async function AuditLogListData(
  query: AuditLogListQuery = {},
): Promise<AuditLogListResult> {
  const params = new URLSearchParams();
  if (query.patientId) params.set('patientId', query.patientId);
  if (query.actorId) params.set('actorId', query.actorId);
  if (query.action) params.set('action', query.action);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.limit) params.set('limit', String(query.limit));
  const qs = params.toString();
  return apiClient.request<AuditLogListResult>(`/audit-logs${qs ? `?${qs}` : ''}`);
}
