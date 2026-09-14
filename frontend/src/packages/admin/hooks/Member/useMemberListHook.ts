'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { MemberListService } from '@/packages/admin/services/Member/MemberListService';

export function useMemberListHook(enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.members,
    queryFn: MemberListService,
    enabled,
  });
}
