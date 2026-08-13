'use client';

import { useQuery } from '@tanstack/react-query';
import type { Dentition } from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { OdontogramGetService } from '@/packages/clinico/services/Odontogram/OdontogramGetService';

export function useOdontogramGetHook(patientId: string | undefined, dentition: Dentition) {
  return useQuery({
    queryKey: clinicoQueryKeys.odontogram(patientId ?? '', dentition),
    queryFn: () => OdontogramGetService(patientId!, dentition),
    enabled: Boolean(patientId),
  });
}
