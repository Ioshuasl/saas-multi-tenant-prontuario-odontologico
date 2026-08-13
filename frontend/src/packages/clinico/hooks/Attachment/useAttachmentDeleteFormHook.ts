'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AttachmentDeleteSchema,
  type AttachmentDeleteFormValues,
} from '@/packages/clinico/schemas/Attachment/AttachmentSchema';

export function useAttachmentDeleteFormHook() {
  return useForm<AttachmentDeleteFormValues>({
    resolver: zodResolver(AttachmentDeleteSchema),
    defaultValues: { reason: '' },
  });
}
