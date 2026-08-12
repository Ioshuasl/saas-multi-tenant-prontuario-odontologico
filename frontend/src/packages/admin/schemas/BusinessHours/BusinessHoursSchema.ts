import { z } from 'zod';

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Horário inválido (HH:mm)');

export const BusinessHoursSlotFormSchema = z.object({
  weekday: z.coerce.number().int().min(1).max(7),
  startsAt: timeSchema,
  endsAt: timeSchema,
});

export const BusinessHoursFormSchema = z.object({
  slots: z.array(BusinessHoursSlotFormSchema).max(50),
});

export type BusinessHoursFormValues = z.infer<typeof BusinessHoursFormSchema>;

export const BusinessHoursExceptionFormSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
    closed: z.boolean(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    reason: z.string().max(200).optional(),
    professionalId: z.union([z.string().uuid(), z.literal('')]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.closed) return;
    if (!value.startsAt || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value.startsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o início (HH:mm)',
        path: ['startsAt'],
      });
    }
    if (!value.endsAt || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(value.endsAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o fim (HH:mm)',
        path: ['endsAt'],
      });
    }
    if (value.startsAt && value.endsAt && value.endsAt <= value.startsAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'O fim deve ser após o início',
        path: ['endsAt'],
      });
    }
  });

export type BusinessHoursExceptionFormValues = z.infer<
  typeof BusinessHoursExceptionFormSchema
>;
