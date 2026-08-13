import { apiClient } from '@/shared/api/api-client';
import type { WaitlistListQuery, WaitlistSummary } from '@/packages/operacional/types/Waitlist/WaitlistTypes';

export async function WaitlistListData(query: WaitlistListQuery = {}): Promise<WaitlistSummary[]> {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.professionalId) params.set('professionalId', query.professionalId);
  if (query.procedureId) params.set('procedureId', query.procedureId);
  const qs = params.toString();
  return apiClient.request<WaitlistSummary[]>(`/waitlist${qs ? `?${qs}` : ''}`);
}
