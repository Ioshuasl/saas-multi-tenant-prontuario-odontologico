import { apiClient } from '@/shared/api/api-client';
import type { TreatmentPlanDetail } from '@/packages/clinico/types/TreatmentPlan/TreatmentPlanTypes';

export async function TreatmentPlanGetData(planId: string): Promise<TreatmentPlanDetail> {
  return apiClient.request<TreatmentPlanDetail>(
    `/treatment-plans/${encodeURIComponent(planId)}`,
  );
}
