import { apiClient } from '@/shared/api/api-client';
import type {
  TreatmentItemExecuteInput,
  TreatmentItemExecuteResult,
} from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentItemExecuteData(
  itemId: string,
  executeSchema: TreatmentItemExecuteInput,
): Promise<TreatmentItemExecuteResult> {
  return apiClient.request<TreatmentItemExecuteResult>(
    `/treatment-items/${encodeURIComponent(itemId)}/execute`,
    {
      method: 'POST',
      body: JSON.stringify(executeSchema),
    },
  );
}
