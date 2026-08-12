'use client';

import { useMutation } from '@tanstack/react-query';
import { PatientCheckDuplicateService } from '@/packages/operacional/services/Patient/PatientCheckDuplicateService';

export function usePatientCheckDuplicateHook() {
  return useMutation({
    mutationFn: (input: { cpf?: string; phone?: string }) =>
      PatientCheckDuplicateService(input),
  });
}
