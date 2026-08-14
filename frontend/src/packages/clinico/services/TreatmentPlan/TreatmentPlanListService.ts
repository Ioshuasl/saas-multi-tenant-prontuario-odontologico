import { TreatmentPlanListData } from '@/packages/clinico/data/TreatmentPlan/TreatmentPlanListData';
import type { TreatmentPlanListQuery } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentPlanListService(query: TreatmentPlanListQuery = {}) {
  return TreatmentPlanListData(query);
}
