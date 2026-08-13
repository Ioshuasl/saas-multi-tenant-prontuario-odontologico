import { z } from 'zod';
import {
  APPOINTMENT_STATUSES,
  SERIES_DELETE_SCOPES,
} from '../enum/appointment/appointment.enum.js';

export const appointmentCreateSchema = z
  .object({
    unitId: z.string().uuid().optional(),
    patientId: z.string().uuid(),
    professionalId: z.string().uuid(),
    chairId: z.string().uuid().optional().nullable(),
    procedureId: z.string().uuid().optional().nullable(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1).optional(),
    notes: z.string().max(4000).optional().nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (Number.isNaN(Date.parse(value.startsAt))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startsAt inválido', path: ['startsAt'] });
    }
    if (value.endsAt && Number.isNaN(Date.parse(value.endsAt))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'endsAt inválido', path: ['endsAt'] });
    }
  });

export type AppointmentCreateSchema = z.infer<typeof appointmentCreateSchema>;

export const appointmentUpdateSchema = z
  .object({
    professionalId: z.string().uuid().optional(),
    chairId: z.string().uuid().optional().nullable(),
    procedureId: z.string().uuid().optional().nullable(),
    startsAt: z.string().min(1).optional(),
    endsAt: z.string().min(1).optional(),
    notes: z.string().max(4000).optional().nullable(),
  })
  .strict();

export type AppointmentUpdateSchema = z.infer<typeof appointmentUpdateSchema>;

export const appointmentStatusSchema = z
  .object({
    status: z.enum(APPOINTMENT_STATUSES),
    reason: z.string().max(500).optional().nullable(),
  })
  .strict();

export type AppointmentStatusSchema = z.infer<typeof appointmentStatusSchema>;

export const appointmentIdParamSchema = z.object({ id: z.string().uuid() });

export const appointmentListQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  professionalId: z.string().uuid().optional(),
  chairId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
});

export type AppointmentListQuerySchema = z.infer<typeof appointmentListQuerySchema>;

export const availabilityQuerySchema = z.object({
  unitId: z.string().uuid().optional(),
  professionalId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  procedureId: z.string().uuid().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  granularityMinutes: z.coerce.number().int().min(5).max(60).optional(),
});

export type AvailabilityQuerySchema = z.infer<typeof availabilityQuerySchema>;

export const appointmentCancelSchema = z
  .object({
    reason: z.string().min(1).max(500),
  })
  .strict();

export type AppointmentCancelSchema = z.infer<typeof appointmentCancelSchema>;

export const scheduleBlockCreateSchema = z
  .object({
    unitId: z.string().uuid().optional(),
    professionalId: z.string().uuid().optional().nullable(),
    chairId: z.string().uuid().optional().nullable(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    reason: z.string().min(1).max(500),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (Number.isNaN(Date.parse(value.startsAt))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startsAt inválido', path: ['startsAt'] });
    }
    if (Number.isNaN(Date.parse(value.endsAt))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'endsAt inválido', path: ['endsAt'] });
    }
  });

export type ScheduleBlockCreateSchema = z.infer<typeof scheduleBlockCreateSchema>;

export const scheduleBlockIdParamSchema = z.object({ id: z.string().uuid() });

export const appointmentSeriesCreateSchema = z
  .object({
    unitId: z.string().uuid().optional(),
    patientId: z.string().uuid(),
    professionalId: z.string().uuid(),
    chairId: z.string().uuid().optional().nullable(),
    procedureId: z.string().uuid().optional().nullable(),
    rrule: z.string().min(3).max(500),
    startsAt: z.string().min(1),
    durationMinutes: z.number().int().min(5).max(480).optional(),
    notes: z.string().max(4000).optional().nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (Number.isNaN(Date.parse(value.startsAt))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'startsAt inválido', path: ['startsAt'] });
    }
  });

export type AppointmentSeriesCreateSchema = z.infer<typeof appointmentSeriesCreateSchema>;

export const appointmentSeriesIdParamSchema = z.object({ id: z.string().uuid() });

export const appointmentSeriesDeleteQuerySchema = z
  .object({
    scope: z.enum(SERIES_DELETE_SCOPES),
    appointmentId: z.string().uuid().optional(),
    reason: z.string().min(1).max(500).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.scope === 'THIS' || value.scope === 'FUTURE') && !value.appointmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'appointmentId é obrigatório para scope THIS ou FUTURE',
        path: ['appointmentId'],
      });
    }
  });

export type AppointmentSeriesDeleteQuerySchema = z.infer<
  typeof appointmentSeriesDeleteQuerySchema
>;
