'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { TreatmentPlanGetService } from '@/packages/clinico/services/TreatmentPlan/TreatmentPlanGetService';

export function useTreatmentPlanGetHook(planId: string | undefined) {
  return useQuery({
    queryKey: clinicoQueryKeys.treatmentPlan(planId ?? ''),
    queryFn: () => TreatmentPlanGetService(planId!),
    enabled: Boolean(planId),
  });
}
