'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BusinessHoursFormSchema,
  type BusinessHoursFormValues,
} from '@/packages/admin/schemas/BusinessHours/BusinessHoursSchema';

export function useBusinessHoursFormHook() {
  return useForm<BusinessHoursFormValues>({
    resolver: zodResolver(BusinessHoursFormSchema),
    defaultValues: { slots: [] },
  });
}
