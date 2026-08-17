'use client';

import { useMutation } from '@tanstack/react-query';
import { TenantExportCreateService } from '@/packages/admin/services/TenantExport/TenantExportCreateService';

export function useTenantExportCreateHook() {
  return useMutation({
    mutationFn: TenantExportCreateService,
  });
}
