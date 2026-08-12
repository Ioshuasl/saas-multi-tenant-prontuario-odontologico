'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClinicUpdateSchema,
  type ClinicUpdateFormValues,
} from '@/packages/admin/schemas/Clinic/ClinicSchema';

export function useClinicFormHook() {
  return useForm<ClinicUpdateFormValues>({
    resolver: zodResolver(ClinicUpdateSchema),
    defaultValues: {
      name: '',
      legalName: '',
      taxId: '',
      responsibleCro: '',
      timezone: 'America/Sao_Paulo',
      acceptedPaymentMethods: [],
      phone: '',
      address: {
        street: '',
        number: '',
        complement: '',
        district: '',
        city: '',
        state: '',
        postalCode: '',
      },
    },
  });
}
