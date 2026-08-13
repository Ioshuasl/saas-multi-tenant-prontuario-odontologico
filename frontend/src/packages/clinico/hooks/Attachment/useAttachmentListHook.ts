'use client';

import { useQuery } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { AttachmentListService } from '@/packages/clinico/services/Attachment/AttachmentListService';

export function useAttachmentListHook(patientId: string | undefined) {
  return useQuery({
    queryKey: clinicoQueryKeys.attachments(patientId ?? ''),
    queryFn: () => AttachmentListService(patientId!),
    enabled: Boolean(patientId),
  });
}
