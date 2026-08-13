'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  WaitlistCreateSchema,
  WaitlistOfferSchema,
  type WaitlistCreateFormValues,
  type WaitlistOfferFormValues,
} from '@/packages/operacional/schemas/Waitlist/WaitlistSchema';

export function useWaitlistCreateFormHook(professionalId?: string) {
  return useForm<WaitlistCreateFormValues>({
    resolver: zodResolver(WaitlistCreateSchema),
    defaultValues: {
      patientId: '',
      procedureId: '',
      professionalId: professionalId ?? '',
      priority: 0,
      anyTime: true,
      weekday: 1,
      from: '08:00',
      to: '12:00',
    },
  });
}

export function useWaitlistOfferFormHook() {
  return useForm<WaitlistOfferFormValues>({
    resolver: zodResolver(WaitlistOfferSchema),
    defaultValues: { appointmentId: '' },
  });
}
