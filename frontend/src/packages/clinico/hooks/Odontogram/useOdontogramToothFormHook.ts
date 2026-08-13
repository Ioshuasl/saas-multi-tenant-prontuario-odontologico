'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Dentition } from '@/packages/clinico/enum/Odontogram/DentitionEnum';
import {
  OdontogramToothSchema,
  type OdontogramToothFormValues,
} from '@/packages/clinico/schemas/Odontogram/OdontogramSchema';

export function useOdontogramToothFormHook(dentition: Dentition) {
  return useForm<OdontogramToothFormValues>({
    resolver: zodResolver(OdontogramToothSchema),
    defaultValues: {
      dentition,
      wholeTooth: true,
      faces: [],
      condition: 'HEALTHY',
      notes: '',
      justification: '',
    },
  });
}
