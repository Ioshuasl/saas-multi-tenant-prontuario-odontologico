import { TreatmentItemExecuteData } from '@/packages/clinico/data/TreatmentPlan/TreatmentItemExecuteData';
import type { TreatmentItemExecuteInput } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentItemExecuteService(
  itemId: string,
  executeSchema: TreatmentItemExecuteInput,
) {
  return TreatmentItemExecuteData(itemId, executeSchema);
}
