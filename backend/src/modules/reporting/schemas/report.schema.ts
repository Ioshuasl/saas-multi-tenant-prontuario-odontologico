import { z } from 'zod';
import { REVENUE_GROUP_BY } from '../enum/report/revenue_group_by.enum.js';
import { EXPORT_FORMATS, EXPORT_REPORTS } from '../enum/export/export.enum.js';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const dashboardQuerySchema = z.object({
  date: isoDate.optional(),
  unitId: z.string().uuid().optional(),
});

export type DashboardQuerySchema = z.infer<typeof dashboardQuerySchema>;

export const noShowQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  professionalId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export type NoShowQuerySchema = z.infer<typeof noShowQuerySchema>;

export const revenueQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  groupBy: z.enum(REVENUE_GROUP_BY).optional(),
  unitId: z.string().uuid().optional(),
});

export type RevenueQuerySchema = z.infer<typeof revenueQuerySchema>;

export const procedureQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  professionalId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
});

export type ProcedureQuerySchema = z.infer<typeof procedureQuerySchema>;

export const exportReportParamSchema = z.object({
  report: z.enum(EXPORT_REPORTS),
});

export type ExportReportParamSchema = z.infer<typeof exportReportParamSchema>;

export const exportCreateSchema = z
  .object({
    format: z.enum(EXPORT_FORMATS),
    from: isoDate.optional(),
    to: isoDate.optional(),
    professionalId: z.string().uuid().optional(),
    unitId: z.string().uuid().optional(),
    groupBy: z.enum(REVENUE_GROUP_BY).optional(),
  })
  .strict();

export type ExportCreateSchema = z.infer<typeof exportCreateSchema>;

export const exportIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ExportIdParamSchema = z.infer<typeof exportIdParamSchema>;
