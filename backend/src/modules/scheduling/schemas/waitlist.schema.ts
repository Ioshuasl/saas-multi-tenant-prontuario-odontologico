import { z } from 'zod';
import { WAITLIST_STATUSES } from '../enum/waitlist/waitlist.enum.js';

const preferredPeriodSchema = z
  .object({
    weekday: z.number().int().min(1).max(7),
    from: z.string().regex(/^\d{2}:\d{2}$/),
    to: z.string().regex(/^\d{2}:\d{2}$/),
  })
  .strict();

export const waitlistCreateSchema = z
  .object({
    patientId: z.string().uuid(),
    professionalId: z.string().uuid().optional().nullable(),
    procedureId: z.string().uuid(),
    preferredPeriods: z.array(preferredPeriodSchema).default([]),
    priority: z.union([z.literal(0), z.literal(1)]).default(0),
  })
  .strict();

export type WaitlistCreateSchema = z.infer<typeof waitlistCreateSchema>;

export const waitlistListQuerySchema = z.object({
  status: z.enum(WAITLIST_STATUSES).optional(),
  professionalId: z.string().uuid().optional(),
  procedureId: z.string().uuid().optional(),
});

export type WaitlistListQuerySchema = z.infer<typeof waitlistListQuerySchema>;

export const waitlistIdParamSchema = z.object({ id: z.string().uuid() });

export const waitlistOfferSchema = z
  .object({
    appointmentId: z.string().uuid(),
  })
  .strict();

export type WaitlistOfferSchema = z.infer<typeof waitlistOfferSchema>;

export const waitlistAcceptTokenParamSchema = z.object({
  token: z.string().min(8),
});
