'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ProcedureCreateSchema,
  ProcedureUpdateSchema,
  type ProcedureCreateFormValues,
  type ProcedureUpdateFormValues,
} from '@/packages/admin/schemas/Procedure/ProcedureSchema';

export function useProcedureCreateFormHook() {
  return useForm<ProcedureCreateFormValues>({
    resolver: zodResolver(ProcedureCreateSchema),
    defaultValues: {
      code: '',
      name: '',
      specialty: '',
      defaultMinutes: 30,
      priceCents: 0,
      requiresTooth: false,
      requiresFace: false,
    },
  });
}

export function useProcedureUpdateFormHook(defaults?: Partial<ProcedureUpdateFormValues>) {
  return useForm<ProcedureUpdateFormValues>({
    resolver: zodResolver(ProcedureUpdateSchema),
    defaultValues: {
      name: defaults?.name ?? '',
      specialty: defaults?.specialty ?? '',
      defaultMinutes: defaults?.defaultMinutes ?? 30,
      priceCents: defaults?.priceCents ?? 0,
      requiresTooth: defaults?.requiresTooth ?? false,
      requiresFace: defaults?.requiresFace ?? false,
      active: defaults?.active ?? true,
    },
  });
}
