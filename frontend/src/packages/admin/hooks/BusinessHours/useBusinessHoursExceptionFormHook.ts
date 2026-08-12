'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BusinessHoursExceptionFormSchema,
  type BusinessHoursExceptionFormValues,
} from '@/packages/admin/schemas/BusinessHours/BusinessHoursSchema';

export function useBusinessHoursExceptionFormHook() {
  return useForm<BusinessHoursExceptionFormValues>({
    resolver: zodResolver(BusinessHoursExceptionFormSchema),
    defaultValues: {
      date: '',
      closed: true,
      startsAt: '',
      endsAt: '',
      reason: '',
      professionalId: '',
    },
  });
}
