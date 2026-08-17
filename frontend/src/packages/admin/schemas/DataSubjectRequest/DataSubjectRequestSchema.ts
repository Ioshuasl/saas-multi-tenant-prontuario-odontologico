import { z } from 'zod';

export const DataSubjectRequestCreateSchema = z.object({
  patientId: z.string().uuid('Selecione o paciente'),
  type: z.enum(['ACCESS', 'CORRECTION', 'DELETION', 'PORTABILITY', 'REVOKE_CONSENT']),
  notes: z.string().max(4000).optional(),
});

export type DataSubjectRequestCreateFormValues = z.infer<typeof DataSubjectRequestCreateSchema>;

export const DataSubjectRequestResolveSchema = z.object({
  resolution: z.string().trim().min(1, 'Informe a resolução').max(4000),
});

export type DataSubjectRequestResolveFormValues = z.infer<typeof DataSubjectRequestResolveSchema>;
