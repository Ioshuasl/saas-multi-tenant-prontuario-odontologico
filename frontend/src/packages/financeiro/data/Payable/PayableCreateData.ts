import { apiClient } from '@/shared/api/api-client';
import type { Payable, PayableCreateInput } from '@/packages/financeiro/types/Payable/PayableTypes';

export async function PayableCreateData(payableCreateSchema: PayableCreateInput): Promise<Payable> {
  return apiClient.request<Payable>('/payables', {
    method: 'POST',
    body: JSON.stringify(payableCreateSchema),
  });
}
