import { apiClient } from '@/shared/api/api-client';
import type { MemberUpdateFormValues } from '@/packages/admin/schemas/Member/MemberSchema';
import type { MemberSummary } from '@/packages/admin/types/Member/MemberTypes';

export async function MemberUpdateData(
  userId: string,
  memberSchema: MemberUpdateFormValues,
): Promise<MemberSummary> {
  return apiClient.request<MemberSummary>(`/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(memberSchema),
  });
}
