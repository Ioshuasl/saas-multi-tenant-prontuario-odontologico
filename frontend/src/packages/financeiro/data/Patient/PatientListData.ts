import { apiClient } from '@/shared/api/api-client';
import type { FinanceiroPatientOption } from '@/packages/financeiro/types/Payment/PaymentTypes';

export type PatientListResult = {
  items: FinanceiroPatientOption[];
  nextCursor: string | null;
};

export async function PatientListData(search = ''): Promise<PatientListResult> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  params.set('limit', '50');
  const qs = params.toString();
  const envelope = await apiClient.requestEnvelope<FinanceiroPatientOption[]>(`/patients?${qs}`);
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
