'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import type { MemberUpdateFormValues } from '@/packages/admin/schemas/Member/MemberSchema';
import { MemberUpdateService } from '@/packages/admin/services/Member/MemberUpdateService';

export function useMemberUpdateHook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      memberSchema,
    }: {
      userId: string;
      memberSchema: MemberUpdateFormValues;
    }) => MemberUpdateService(userId, memberSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.members });
      await queryClient.invalidateQueries({ queryKey: adminQueryKeys.onboarding });
    },
  });
}
