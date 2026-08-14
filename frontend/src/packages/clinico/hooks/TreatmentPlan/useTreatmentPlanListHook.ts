'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { TreatmentPlanListService } from '@/packages/clinico/services/TreatmentPlan/TreatmentPlanListService';
import type { TreatmentPlanStatus } from '@/packages/clinico/enum/TreatmentPlan/TreatmentPlanStatusEnum';

export function useTreatmentPlanListHook(patientId: string | undefined, status?: TreatmentPlanStatus) {
  return useQuery({
    queryKey: [...clinicoQueryKeys.treatmentPlans(patientId ?? ''), status ?? ''] as const,
    queryFn: () =>
      TreatmentPlanListService({
        patientId,
        status,
        limit: 20,
      }),
    enabled: Boolean(patientId),
  });
}
