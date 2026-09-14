import { z } from 'zod';
import { EXPORT_REPORTS } from '@/packages/admin/enum/Report/ExportEnum';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ExportCreateSchema = z.object({
  report: z.enum(EXPORT_REPORTS),
  from: isoDate,
  to: isoDate,
});

export type ExportCreateFormValues = z.infer<typeof ExportCreateSchema>;
