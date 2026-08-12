import { apiClient } from '@/shared/api/api-client';
import type { MemberSummary } from '@/packages/admin/types/Member/MemberTypes';

export async function MemberListData(): Promise<MemberSummary[]> {
  return apiClient.request<MemberSummary[]>('/users');
}
