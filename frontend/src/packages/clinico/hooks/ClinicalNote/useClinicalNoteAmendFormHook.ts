'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClinicalNoteAmendSchema,
  type ClinicalNoteAmendFormValues,
} from '@/packages/clinico/schemas/ClinicalNote/ClinicalNoteSchema';

export function useClinicalNoteAmendFormHook(content: string) {
  return useForm<ClinicalNoteAmendFormValues>({
    resolver: zodResolver(ClinicalNoteAmendSchema),
    defaultValues: { content, reason: '' },
  });
}
