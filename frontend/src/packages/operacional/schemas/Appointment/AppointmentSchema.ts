import { z } from 'zod';
import { APPOINTMENT_STATUSES } from '@/packages/operacional/enum/Appointment/AppointmentStatusEnum';

export const AppointmentCreateSchema = z.object({
  patientId: z.string().uuid('Selecione o paciente'),
  professionalId: z.string().uuid('Selecione o profissional'),
  chairId: z.union([z.string().uuid(), z.literal('')]).optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1).optional(),
  notes: z.string().max(4000).optional().nullable(),
  recurring: z.boolean().optional(),
  rruleFreq: z.enum(['WEEKLY', 'MONTHLY']).optional(),
});

export type AppointmentCreateFormValues = z.infer<typeof AppointmentCreateSchema>;

export const AppointmentStatusFormSchema = z.object({
  status: z.enum(APPOINTMENT_STATUSES),
  reason: z.string().max(500).optional().nullable(),
});

export type AppointmentStatusFormValues = z.infer<typeof AppointmentStatusFormSchema>;

export const ScheduleBlockFormSchema = z.object({
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  reason: z.string().min(1, 'Informe o motivo').max(500),
});

export type ScheduleBlockFormValues = z.infer<typeof ScheduleBlockFormSchema>;
