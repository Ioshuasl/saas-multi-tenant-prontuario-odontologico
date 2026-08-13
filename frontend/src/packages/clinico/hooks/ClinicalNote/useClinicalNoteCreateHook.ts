'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { ClinicalNoteCreateService } from '@/packages/clinico/services/ClinicalNote/ClinicalNoteCreateService';

export function useClinicalNoteCreateHook(patientId: string, appointmentId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ClinicalNoteCreateService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.notes(patientId) });
      if (appointmentId) {
        await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.appointment(appointmentId) });
      }
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
