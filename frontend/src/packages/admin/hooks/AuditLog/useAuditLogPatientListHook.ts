'use client';

import { useQuery } from '@tanstack/react-query';
import { adminQueryKeys } from '@/packages/admin/helpers/AdminQueryKeys';
import { AuditLogPatientListService } from '@/packages/admin/services/AuditLog/AuditLogPatientListService';

export function useAuditLogPatientListHook(search: string, enabled = true) {
  return useQuery({
    queryKey: adminQueryKeys.auditLogPatients(search),
    queryFn: () => AuditLogPatientListService(search),
    enabled,
  });
}
