import { apiClient } from '@/shared/api/api-client';
import type { Payable, PayableUpdateInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayableUpdateData(
  payableId: string,
  payableUpdateSchema: PayableUpdateInput,
): Promise<Payable> {
  return apiClient.request<Payable>(`/payables/${encodeURIComponent(payableId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payableUpdateSchema),
  });
}
