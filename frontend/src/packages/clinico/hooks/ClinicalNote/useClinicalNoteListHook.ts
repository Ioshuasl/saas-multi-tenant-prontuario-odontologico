'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { ClinicalNoteListService } from '@/packages/clinico/services/ClinicalNote/ClinicalNoteListService';

export function useClinicalNoteListHook(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicoQueryKeys.notes(patientId ?? ''),
    queryFn: () => ClinicalNoteListService(patientId!),
    enabled: Boolean(patientId),
  });
}
