'use client';

import { useMutation } from '@tanstack/react-query';
import type { ExportableReport } from '@/packages/admin/enum/Report/ExportableReportEnum';
import { ReportExportCreateService } from '@/packages/admin/services/Report/ReportExportCreateService';
import type { ReportExportCreateInput } from '@/packages/admin/types/Report/ReportTypes';

export function useReportExportCreateHook() {
  return useMutation({
    mutationFn: (input: { report: ExportableReport; body: ReportExportCreateInput }) =>
      ReportExportCreateService(input.report, input.body),
  });
}
