import { TreatmentPlanGetData } from '@/packages/clinico/data/TreatmentPlan/TreatmentPlanGetData';

export async function TreatmentPlanGetService(planId: string) {
  return TreatmentPlanGetData(planId);
}
