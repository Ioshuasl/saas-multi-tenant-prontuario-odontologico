import { apiClient } from '@/shared/api/api-client';

export type PatientInstallmentSummary = {
  id: string;
  amountCents: number;
  paidCents: number;
  status: string;
};

export type PatientInstallmentListResult = {
  items: PatientInstallmentSummary[];
  nextCursor: string | null;
};

export async function PatientInstallmentListData(
  patientId: string,
): Promise<PatientInstallmentListResult> {
  const params = new URLSearchParams();
  params.set('patientId', patientId);
  params.set('limit', '50');
  const envelope = await apiClient.requestEnvelope<PatientInstallmentSummary[]>(
    `/installments?${params.toString()}`,
  );
  return {
    items: envelope.data,
    nextCursor: (envelope.meta?.nextCursor as string | null | undefined) ?? null,
  };
}
