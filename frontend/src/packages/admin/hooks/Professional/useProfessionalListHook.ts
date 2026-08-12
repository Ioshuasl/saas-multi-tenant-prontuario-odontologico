'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ProfessionalListService } from '@/packages/admin/services/Professional/ProfessionalListService';

export function useProfessionalListHook() {
  return useQuery({
    queryKey: adminQueryKeys.professionals,
    queryFn: ProfessionalListService,
  });
}
