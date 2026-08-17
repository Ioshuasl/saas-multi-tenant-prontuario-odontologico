import { z } from 'zod';
import { reaisInputToCents } from '@/packages/financeiro/helpers/FormatCents';
import type {
  PayableCreateInput,
  PayableUpdateInput,
} from '@/packages/financeiro/types/Payable/PayableTypes';

export const PayableFormSchema = z.object({
  categoryId: z.string().uuid('Selecione a categoria.'),
  description: z.string().trim().min(3, 'Descrição com ao menos 3 caracteres.'),
  amountReais: z.string().min(1, 'Informe o valor.'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe o vencimento.'),
  supplier: z.string().optional(),
  monthly: z.boolean(),
  until: z.string().optional(),
});

export type PayableFormValues = z.infer<typeof PayableFormSchema>;

export function toPayableCreatePayload(
  unitId: string,
  values: PayableFormValues,
): PayableCreateInput {
  return {
    unitId,
    categoryId: values.categoryId,
    description: values.description.trim(),
    amountCents: reaisInputToCents(values.amountReais),
    dueDate: values.dueDate,
    supplier: values.supplier?.trim() || null,
    recurrence: values.monthly
      ? { frequency: 'MONTHLY', until: values.until || null }
      : null,
  };
}

export function toPayableUpdatePayload(values: PayableFormValues): PayableUpdateInput {
  return {
    categoryId: values.categoryId,
    description: values.description.trim(),
    amountCents: reaisInputToCents(values.amountReais),
    dueDate: values.dueDate,
    supplier: values.supplier?.trim() || null,
    recurrence: values.monthly
      ? { frequency: 'MONTHLY', until: values.until || null }
      : null,
  };
}
