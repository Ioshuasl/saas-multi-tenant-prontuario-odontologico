import { z } from 'zod';
import { DSR_STATUSES } from '../enum/data_subject_request/data_subject_request_status.enum.js';
import { DSR_TYPES } from '../enum/data_subject_request/data_subject_request_type.enum.js';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === undefined || value === null ? undefined : value;

export const dataSubjectRequestCreateSchema = z
  .object({
    patientId: z.string().uuid(),
    type: z.enum(DSR_TYPES),
    notes: z.string().trim().min(1).max(4000).optional(),
  })
  .strict();

export type DataSubjectRequestCreateSchema = z.infer<typeof dataSubjectRequestCreateSchema>;

export const dataSubjectRequestUpdateSchema = z
  .object({
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'REJECTED']).optional(),
    resolution: z.string().trim().min(1).max(4000).optional(),
  })
  .strict()
  .refine((value) => value.status !== undefined || value.resolution !== undefined, {
    message: 'Informe status ou resolution.',
  })
  .refine(
    (value) =>
      value.status !== 'COMPLETED' && value.status !== 'REJECTED'
        ? true
        : Boolean(value.resolution),
    { message: 'resolution é obrigatória ao concluir ou rejeitar.' },
  );

export type DataSubjectRequestUpdateSchema = z.infer<typeof dataSubjectRequestUpdateSchema>;

export const dataSubjectRequestIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type DataSubjectRequestIdParamSchema = z.infer<typeof dataSubjectRequestIdParamSchema>;

export const dataSubjectRequestListQuerySchema = z
  .object({
    patientId: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    status: z.preprocess(emptyToUndefined, z.enum(DSR_STATUSES).optional()),
    type: z.preprocess(emptyToUndefined, z.enum(DSR_TYPES).optional()),
    cursor: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

export type DataSubjectRequestListQuerySchema = z.infer<typeof dataSubjectRequestListQuerySchema>;
