import { InstallmentChargeData } from '@/packages/financeiro/data/Installment/InstallmentChargeData';
import type { InstallmentChargeInput } from '@/packages/financeiro/types/Report/ReportTypes';

export async function InstallmentChargeService(
  installmentId: string,
  installmentChargeSchema: InstallmentChargeInput,
) {
  return InstallmentChargeData(installmentId, installmentChargeSchema);
}
