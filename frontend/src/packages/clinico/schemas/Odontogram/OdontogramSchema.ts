import { z } from 'zod';
import { DENTITIONS } from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import { TOOTH_CONDITIONS } from '@/packages/clinico/enum/Odontogram/ToothConditionEnum';
import { TOOTH_FACES } from '@/packages/clinico/enum/Odontogram/ToothFaceEnum';

export const OdontogramToothSchema = z
  .object({
    dentition: z.enum(DENTITIONS),
    wholeTooth: z.boolean(),
    faces: z.array(z.enum(TOOTH_FACES)),
    condition: z.enum(TOOTH_CONDITIONS),
    notes: z.string().max(2000).optional(),
    justification: z.string().max(2000).optional(),
  })
  .refine((value) => value.wholeTooth || value.faces.length > 0, {
    message: 'Selecione o dente inteiro ou ao menos uma face',
    path: ['faces'],
  });

export type OdontogramToothFormValues = z.infer<typeof OdontogramToothSchema>;
