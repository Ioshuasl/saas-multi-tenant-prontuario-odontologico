'use client';

import { useMutation } from '@tanstack/react-query';
import { ExportCreateService } from '@/packages/admin/services/Export/ExportCreateService';
import type { ExportReport } from '@/packages/admin/enum/Report/ExportEnum';
import type { ExportCreateInput } from '@/packages/admin/types/Export/ExportTypes';

export function useExportCreateHook() {
  return useMutation({
    mutationFn: (input: { report: ExportReport; exportCreateSchema: ExportCreateInput }) =>
      ExportCreateService(input.report, input.exportCreateSchema),
  });
}
