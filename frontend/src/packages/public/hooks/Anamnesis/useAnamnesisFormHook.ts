'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAnamnesisAnswersSchema,
  defaultAnamnesisAnswers,
  type AnamnesisAnswersFormValues,
} from '@/packages/public/schemas/Anamnesis/AnamnesisSchema';
import type { AnamnesisQuestion } from '@/packages/public/types/Anamnesis/AnamnesisTypes';

export function useAnamnesisFormHook(questions: AnamnesisQuestion[]) {
  const schema = useMemo(() => createAnamnesisAnswersSchema(questions), [questions]);
  const defaultValues = useMemo(() => defaultAnamnesisAnswers(questions), [questions]);

  return useForm<AnamnesisAnswersFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });
}
