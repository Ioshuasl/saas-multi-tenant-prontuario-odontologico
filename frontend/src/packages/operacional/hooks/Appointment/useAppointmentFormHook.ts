'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AppointmentCreateSchema,
  AppointmentStatusFormSchema,
  ScheduleBlockFormSchema,
  type AppointmentCreateFormValues,
  type AppointmentStatusFormValues,
  type ScheduleBlockFormValues,
} from '@/packages/operacional/schemas/Appointment/AppointmentSchema';

export function useAppointmentCreateFormHook(defaults?: Partial<AppointmentCreateFormValues>) {
  return useForm<AppointmentCreateFormValues>({
    resolver: zodResolver(AppointmentCreateSchema),
    defaultValues: {
      patientId: '',
      professionalId: defaults?.professionalId ?? '',
      chairId: defaults?.chairId ?? '',
      startsAt: defaults?.startsAt ?? '',
      endsAt: defaults?.endsAt ?? '',
      notes: '',
      recurring: false,
      rruleFreq: 'WEEKLY',
      ...defaults,
    },
  });
}

export function useAppointmentStatusFormHook(status: AppointmentStatusFormValues['status']) {
  return useForm<AppointmentStatusFormValues>({
    resolver: zodResolver(AppointmentStatusFormSchema),
    defaultValues: { status, reason: '' },
  });
}

export function useScheduleBlockFormHook(defaults?: Partial<ScheduleBlockFormValues>) {
  return useForm<ScheduleBlockFormValues>({
    resolver: zodResolver(ScheduleBlockFormSchema),
    defaultValues: {
      startsAt: defaults?.startsAt ?? '',
      endsAt: defaults?.endsAt ?? '',
      reason: '',
      ...defaults,
    },
  });
}
