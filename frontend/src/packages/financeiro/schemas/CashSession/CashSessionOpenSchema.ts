import { z } from 'zod';
import { reaisInputToCents } from '@/packages/financeiro/helpers/FormatCents';
import type { CashSessionCreateInput } from '@/packages/financeiro/types/CashSession/CashSessionTypes';

export const CashSessionOpenFormSchema = z.object({
  openingReais: z.string().min(1, 'Informe o valor inicial.'),
});

export type CashSessionOpenFormValues = z.infer<typeof CashSessionOpenFormSchema>;

export function toCashSessionCreatePayload(
  unitId: string,
  values: CashSessionOpenFormValues,
): CashSessionCreateInput {
  return {
    unitId,
    openingCents: reaisInputToCents(values.openingReais),
  };
}
