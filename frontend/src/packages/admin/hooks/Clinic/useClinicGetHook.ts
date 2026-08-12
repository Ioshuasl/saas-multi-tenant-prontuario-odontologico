'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { ClinicGetService } from '@/packages/admin/services/Clinic/ClinicGetService';

export function useClinicGetHook(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: adminQueryKeys.clinic,
    queryFn: ClinicGetService,
    enabled: options?.enabled ?? true,
  });
}
