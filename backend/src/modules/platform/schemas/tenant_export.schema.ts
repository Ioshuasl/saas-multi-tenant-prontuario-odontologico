import { z } from 'zod';

export const tenantExportCreateSchema = z.object({}).strict();

export type TenantExportCreateSchema = z.infer<typeof tenantExportCreateSchema>;

export const tenantExportIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type TenantExportIdParamSchema = z.infer<typeof tenantExportIdParamSchema>;
