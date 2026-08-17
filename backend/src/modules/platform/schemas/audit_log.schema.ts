import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === undefined || value === null ? undefined : value;

export const auditLogListQuerySchema = z
  .object({
    patientId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    actorId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    action: z.preprocess(emptyToUndefined, z.string().min(1).max(64).optional()),
    from: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    to: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    cursor: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export type AuditLogListQuerySchema = z.infer<typeof auditLogListQuerySchema>;
