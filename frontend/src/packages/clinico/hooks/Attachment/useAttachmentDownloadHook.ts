'use client';

import { useMutation } from '@tanstack/react-query';
import { AttachmentDownloadService } from '@/packages/clinico/services/Attachment/AttachmentDownloadService';

export function useAttachmentDownloadHook() {
  return useMutation({
    mutationFn: AttachmentDownloadService,
  });
}
