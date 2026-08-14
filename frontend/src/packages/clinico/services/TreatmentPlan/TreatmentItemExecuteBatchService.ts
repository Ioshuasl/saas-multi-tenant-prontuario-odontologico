import { TreatmentItemExecuteBatchData } from '@/packages/clinico/data/TreatmentPlan/TreatmentItemExecuteBatchData';
import type { TreatmentItemBatchExecuteInput } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentItemExecuteBatchService(
  executeSchema: TreatmentItemBatchExecuteInput,
) {
  return TreatmentItemExecuteBatchData(executeSchema);
}
