'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { InvitationListService } from '@/packages/admin/services/Invitation/InvitationListService';

export function useInvitationListHook() {
  return useQuery({
    queryKey: adminQueryKeys.invitations,
    queryFn: InvitationListService,
  });
}
