import { MemberUpdateData } from '@/packages/admin/data/Member/MemberUpdateData';
import type { MemberUpdateFormValues } from '@/packages/admin/schemas/Member/MemberSchema';

export async function MemberUpdateService(userId: string, memberSchema: MemberUpdateFormValues) {
  return MemberUpdateData(userId, memberSchema);
}
