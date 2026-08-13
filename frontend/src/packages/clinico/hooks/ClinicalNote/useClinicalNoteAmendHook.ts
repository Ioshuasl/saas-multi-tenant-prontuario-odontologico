'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { ClinicalNoteAmendService } from '@/packages/clinico/services/ClinicalNote/ClinicalNoteAmendService';

export function useClinicalNoteAmendHook(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ClinicalNoteAmendService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.notes(patientId) });
    },
  });
}
