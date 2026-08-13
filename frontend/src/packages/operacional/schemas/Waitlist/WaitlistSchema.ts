import { z } from 'zod';

export const WaitlistCreateSchema = z
  .object({
    patientId: z.string().uuid('Selecione o paciente'),
    procedureId: z.string().uuid('Selecione o procedimento'),
    professionalId: z.string().optional(),
    priority: z.union([z.literal(0), z.literal(1)]),
    anyTime: z.boolean(),
    weekday: z.coerce.number().int().min(1).max(7).optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.anyTime) return;
    if (!value.weekday) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o dia da semana', path: ['weekday'] });
    }
    if (!value.from || !/^\d{2}:\d{2}$/.test(value.from)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o horário inicial', path: ['from'] });
    }
    if (!value.to || !/^\d{2}:\d{2}$/.test(value.to)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Informe o horário final', path: ['to'] });
    }
  });

export type WaitlistCreateFormValues = z.infer<typeof WaitlistCreateSchema>;

export const WaitlistOfferSchema = z.object({
  appointmentId: z.string().uuid('Selecione o horário cancelado'),
});

export type WaitlistOfferFormValues = z.infer<typeof WaitlistOfferSchema>;
