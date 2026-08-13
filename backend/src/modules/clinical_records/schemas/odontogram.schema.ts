import { z } from 'zod';
import { DENTITIONS } from '../enum/tooth_state/dentition.enum.js';
import { TOOTH_CONDITIONS } from '../enum/tooth_state/tooth_condition.enum.js';
import { TOOTH_FACES } from '../enum/tooth_state/tooth_face.enum.js';

export const odontogramGetQuerySchema = z
  .object({
    dentition: z.enum(DENTITIONS),
    at: z.string().datetime().optional(),
  })
  .strict();

export type OdontogramGetQuerySchema = z.infer<typeof odontogramGetQuerySchema>;

export const odontogramToothParamSchema = z
  .object({
    patientId: z.string().uuid(),
    toothCode: z.string().regex(/^\d{2}$/),
  })
  .strict();

export type OdontogramToothParamSchema = z.infer<typeof odontogramToothParamSchema>;

export const odontogramToothUpdateSchema = z
  .object({
    dentition: z.enum(DENTITIONS),
    face: z.enum(TOOTH_FACES).nullable().optional(),
    condition: z.enum(TOOTH_CONDITIONS),
    notes: z.string().max(2000).nullable().optional(),
    justification: z
      .string()
      .nullable()
      .optional()
      .refine((v) => v == null || v.trim().length >= 10, {
        message: 'justification mínimo 10 caracteres',
      }),
  })
  .strict();

export type OdontogramToothUpdateSchema = z.infer<typeof odontogramToothUpdateSchema>;
