import { z } from 'zod';

export const TreatmentExecuteSchema = z.object({
  note: z.string().trim().min(10, 'Mínimo 10 caracteres').max(20000),
});

export type TreatmentExecuteFormValues = z.infer<typeof TreatmentExecuteSchema>;
