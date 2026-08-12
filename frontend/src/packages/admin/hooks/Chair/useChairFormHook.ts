'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChairCreateSchema,
  ChairUpdateSchema,
  type ChairCreateFormValues,
  type ChairUpdateFormValues,
} from '@/packages/admin/schemas/Chair/ChairSchema';

export function useChairCreateFormHook() {
  return useForm<ChairCreateFormValues>({
    resolver: zodResolver(ChairCreateSchema),
    defaultValues: { name: '', color: '' },
  });
}

export function useChairUpdateFormHook() {
  return useForm<ChairUpdateFormValues>({
    resolver: zodResolver(ChairUpdateSchema),
    defaultValues: { name: '', color: '', active: true },
  });
}
