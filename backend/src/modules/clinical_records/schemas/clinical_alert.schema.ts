import { z } from 'zod';
import { ALERT_CATEGORIES } from '../enum/clinical_alert/alert_category.enum.js';
import { ALERT_SEVERITIES } from '../enum/clinical_alert/alert_severity.enum.js';

export const clinicalAlertListQuerySchema = z
  .object({
    severity: z.enum(ALERT_SEVERITIES).optional(),
    category: z.enum(ALERT_CATEGORIES).optional(),
    active: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  })
  .strict();

export type ClinicalAlertListQuerySchema = z.infer<typeof clinicalAlertListQuerySchema>;

export const clinicalAlertCreateSchema = z
  .object({
    severity: z.enum(ALERT_SEVERITIES),
    category: z.enum(ALERT_CATEGORIES),
    description: z.string().min(1).max(2000),
  })
  .strict();

export type ClinicalAlertCreateSchema = z.infer<typeof clinicalAlertCreateSchema>;

export const clinicalAlertUpdateSchema = z
  .object({
    active: z.boolean(),
  })
  .strict();

export type ClinicalAlertUpdateSchema = z.infer<typeof clinicalAlertUpdateSchema>;

export const clinicalAlertIdParamSchema = z
  .object({
    patientId: z.string().uuid(),
    id: z.string().uuid(),
  })
  .strict();

export type ClinicalAlertIdParamSchema = z.infer<typeof clinicalAlertIdParamSchema>;
