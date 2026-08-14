import { apiClient } from '@/shared/api/api-client';
import type {
  TreatmentItemBatchExecuteInput,
  TreatmentItemExecuteResult,
} from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentItemExecuteBatchData(
  executeSchema: TreatmentItemBatchExecuteInput,
): Promise<TreatmentItemExecuteResult> {
  return apiClient.request<TreatmentItemExecuteResult>('/treatment-items/execute', {
    method: 'POST',
    body: JSON.stringify(executeSchema),
  });
}
