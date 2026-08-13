'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { AttachmentDeleteService } from '@/packages/clinico/services/Attachment/AttachmentDeleteService';

export function useAttachmentDeleteHook(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: AttachmentDeleteService,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.attachments(patientId) });
    },
  });
}
