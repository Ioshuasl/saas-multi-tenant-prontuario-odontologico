'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataSubjectRequestType } from '@/packages/admin/enum/DataSubjectRequest/DataSubjectRequestTypeEnum';
import {
  DataSubjectRequestCreateSchema,
  type DataSubjectRequestCreateFormValues,
} from '@/packages/admin/schemas/DataSubjectRequest/DataSubjectRequestSchema';

export function useDataSubjectRequestFormHook() {
  return useForm<DataSubjectRequestCreateFormValues>({
    resolver: zodResolver(DataSubjectRequestCreateSchema),
    defaultValues: {
      patientId: '',
      type: DataSubjectRequestType.ACCESS,
      notes: '',
    },
  });
}
