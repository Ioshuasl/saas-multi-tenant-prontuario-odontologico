import { z } from 'zod';

export const medicalRecordPatientIdParamSchema = z
  .object({
    patientId: z.string().uuid(),
  })
  .strict();

export type MedicalRecordPatientIdParamSchema = z.infer<typeof medicalRecordPatientIdParamSchema>;
