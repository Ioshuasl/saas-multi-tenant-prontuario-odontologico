import { z } from 'zod';
import { Role } from '../enum/role/role.enum.js';

const roleSchema = z.enum([
  Role.OWNER,
  Role.DENTIST,
  Role.RECEPTION,
  Role.ASSISTANT,
  Role.FINANCE,
]);

export const userUpdateSchema = z
  .object({
    role: roleSchema.optional(),
    active: z.boolean().optional(),
    defaultUnitId: z.string().uuid().nullable().optional(),
    permissions: z
      .object({
        grant: z.array(z.string()).optional(),
        revoke: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.active !== undefined ||
      value.defaultUnitId !== undefined ||
      value.permissions !== undefined,
    { message: 'Informe ao menos um campo para atualizar.' },
  );

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
