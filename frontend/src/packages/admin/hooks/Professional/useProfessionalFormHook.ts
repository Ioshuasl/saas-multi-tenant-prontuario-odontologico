'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ProfessionalCreateSchema,
  ProfessionalUpdateSchema,
  type ProfessionalCreateFormValues,
  type ProfessionalUpdateFormValues,
} from '@/packages/admin/schemas/Professional/ProfessionalSchema';

export function useProfessionalCreateFormHook() {
  return useForm<ProfessionalCreateFormValues>({
    resolver: zodResolver(ProfessionalCreateSchema),
    defaultValues: {
      membershipId: '',
      croNumber: '',
      croState: '',
      specialtiesText: '',
      color: '',
    },
  });
}

export function useProfessionalUpdateFormHook(
  defaults?: Partial<ProfessionalUpdateFormValues>,
) {
  return useForm<ProfessionalUpdateFormValues>({
    resolver: zodResolver(ProfessionalUpdateSchema),
    defaultValues: {
      croNumber: defaults?.croNumber ?? '',
      croState: defaults?.croState ?? '',
      specialtiesText: defaults?.specialtiesText ?? '',
      color: defaults?.color ?? '',
      active: defaults?.active ?? true,
    },
  });
}
