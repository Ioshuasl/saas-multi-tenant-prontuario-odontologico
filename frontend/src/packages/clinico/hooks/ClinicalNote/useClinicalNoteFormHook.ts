'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClinicalNoteCreateSchema,
  type ClinicalNoteCreateFormValues,
} from '@/packages/clinico/schemas/ClinicalNote/ClinicalNoteSchema';

export function useClinicalNoteFormHook(defaultContent = '') {
  return useForm<ClinicalNoteCreateFormValues>({
    resolver: zodResolver(ClinicalNoteCreateSchema),
    defaultValues: { content: defaultContent },
  });
}
