'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ConsentCreateSchema,
  GuardianCreateSchema,
  PatientCreateSchema,
  PatientUpdateSchema,
  type ConsentCreateFormValues,
  type GuardianCreateFormValues,
  type PatientCreateFormValues,
  type PatientUpdateFormValues,
} from '@/packages/operacional/schemas/Patient/PatientSchema';

export function usePatientCreateFormHook() {
  return useForm<PatientCreateFormValues>({
    resolver: zodResolver(PatientCreateSchema),
    defaultValues: {
      name: '',
      socialName: '',
      cpf: '',
      birthDate: '',
      sex: '',
      phonePrimary: '',
      phoneSecondary: '',
      email: '',
      notes: '',
    },
  });
}

export function usePatientUpdateFormHook() {
  return useForm<PatientUpdateFormValues>({
    resolver: zodResolver(PatientUpdateSchema),
    defaultValues: {
      name: '',
      socialName: '',
      cpf: '',
      birthDate: '',
      sex: '',
      phonePrimary: '',
      phoneSecondary: '',
      email: '',
      notes: '',
      active: true,
    },
  });
}

export function useGuardianCreateFormHook() {
  return useForm<GuardianCreateFormValues>({
    resolver: zodResolver(GuardianCreateSchema),
    defaultValues: {
      name: '',
      cpf: '',
      relationship: '',
      phone: '',
      email: '',
    },
  });
}

export function useConsentCreateFormHook() {
  return useForm<ConsentCreateFormValues>({
    resolver: zodResolver(ConsentCreateSchema),
    defaultValues: {
      type: 'DATA_PROCESSING',
      granted: true,
      documentVersion: 'v1',
      channel: 'IN_PERSON',
    },
  });
}
