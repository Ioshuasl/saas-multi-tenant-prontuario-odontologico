import { z } from 'zod';
import { PAYMENT_METHODS } from '@/packages/admin/enum/PaymentMethodEnum';

const addressSchema = z
  .object({
    street: z.string().max(200).optional(),
    number: z.string().max(20).optional(),
    complement: z.string().max(100).optional(),
    district: z.string().max(100).optional(),
    city: z.string().max(100).optional(),
    state: z.string().max(2).optional(),
    postalCode: z.string().max(20).optional(),
  })
  .optional()
  .nullable();

export const ClinicUpdateSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(120),
  legalName: z.string().max(200).optional().nullable(),
  taxId: z.string().max(20).optional().nullable(),
  responsibleCro: z.string().max(20).optional().nullable(),
  timezone: z.string().min(3, 'Timezone obrigatório').max(64),
  acceptedPaymentMethods: z
    .array(z.enum(PAYMENT_METHODS as [string, ...string[]]))
    .min(1, 'Selecione ao menos um método'),
  phone: z.string().max(30).optional().nullable(),
  address: addressSchema,
});

export type ClinicUpdateFormValues = z.infer<typeof ClinicUpdateSchema>;
