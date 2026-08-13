'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AnamnesisSendLinkSchema,
  type AnamnesisSendLinkFormValues,
} from '@/packages/operacional/schemas/Anamnesis/AnamnesisSendLinkSchema';

export function useAnamnesisSendLinkFormHook() {
  return useForm<AnamnesisSendLinkFormValues>({
    resolver: zodResolver(AnamnesisSendLinkSchema),
    defaultValues: { channel: 'COPY' },
  });
}
