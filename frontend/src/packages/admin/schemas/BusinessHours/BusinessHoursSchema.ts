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
