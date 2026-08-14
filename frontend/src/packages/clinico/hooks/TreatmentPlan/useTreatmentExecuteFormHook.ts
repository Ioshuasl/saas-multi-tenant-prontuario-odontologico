'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  TreatmentExecuteSchema,
  type TreatmentExecuteFormValues,
} from '@/packages/clinico/schemas/TreatmentPlan/TreatmentExecuteSchema';

export function useTreatmentExecuteFormHook(defaultNote = '') {
  return useForm<TreatmentExecuteFormValues>({
    resolver: zodResolver(TreatmentExecuteSchema),
    defaultValues: { note: defaultNote },
  });
}
