import { apiClient } from '@/shared/api/api-client';
import type {
  InstallmentChargeInput,
  InstallmentChargeResult,
} from '@/packages/financeiro/types/Report/ReportTypes';

export async function InstallmentChargeData(
  installmentId: string,
  installmentChargeSchema: InstallmentChargeInput,
): Promise<InstallmentChargeResult> {
  return apiClient.request<InstallmentChargeResult>(
    `/installments/${encodeURIComponent(installmentId)}/charge`,
    {
      method: 'POST',
      body: JSON.stringify(installmentChargeSchema),
    },
  );
}
