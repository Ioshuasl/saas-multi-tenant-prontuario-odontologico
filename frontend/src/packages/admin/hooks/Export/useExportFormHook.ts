'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { monthRangeIso } from '@/packages/admin/helpers/ReportPeriod';
import {
  ExportCreateSchema,
  type ExportCreateFormValues,
} from '@/packages/admin/schemas/Export/ExportSchema';

export function useExportFormHook() {
  const range = monthRangeIso();
  return useForm<ExportCreateFormValues>({
    resolver: zodResolver(ExportCreateSchema),
    defaultValues: {
      report: 'procedures',
      from: range.from,
      to: range.to,
    },
  });
}
