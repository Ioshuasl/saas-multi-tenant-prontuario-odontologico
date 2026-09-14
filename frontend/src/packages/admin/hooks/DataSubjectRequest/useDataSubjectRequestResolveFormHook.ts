'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  DataSubjectRequestResolveSchema,
  type DataSubjectRequestResolveFormValues,
} from '@/packages/admin/schemas/DataSubjectRequest/DataSubjectRequestSchema';

export function useDataSubjectRequestResolveFormHook() {
  return useForm<DataSubjectRequestResolveFormValues>({
    resolver: zodResolver(DataSubjectRequestResolveSchema),
    defaultValues: { resolution: '' },
  });
}
