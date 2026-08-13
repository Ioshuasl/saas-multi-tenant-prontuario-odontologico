'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AttachmentCategory } from '@/packages/clinico/enum/Attachment/AttachmentCategoryEnum';
import {
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MIME_ALLOWLIST,
  sha256Hex,
} from '@/packages/clinico/helpers/AttachmentChecksum';
import { clinicoQueryKeys } from '@/packages/clinico/helpers/ClinicoQueryKeys';
import { AttachmentCreateService } from '@/packages/clinico/services/Attachment/AttachmentCreateService';
import { AttachmentPresignService } from '@/packages/clinico/services/Attachment/AttachmentPresignService';
import { AttachmentPutService } from '@/packages/clinico/services/Attachment/AttachmentPutService';

export function useAttachmentUploadHook(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: File; category: AttachmentCategory }) => {
      if (!ATTACHMENT_MIME_ALLOWLIST.includes(input.file.type as (typeof ATTACHMENT_MIME_ALLOWLIST)[number])) {
        throw new Error('Tipo de arquivo não permitido.');
      }
      if (input.file.size > ATTACHMENT_MAX_BYTES) {
        throw new Error('Arquivo maior que 20 MB.');
      }
      const presign = await AttachmentPresignService({
        patientId,
        fileName: input.file.name,
        mimeType: input.file.type,
        sizeBytes: input.file.size,
        category: input.category,
      });
      await AttachmentPutService({
        uploadUrl: presign.uploadUrl,
        headers: presign.headers,
        file: input.file,
      });
      const checksumSha256 = await sha256Hex(input.file);
      return AttachmentCreateService({
        patientId,
        storageKey: presign.storageKey,
        checksumSha256,
        fileName: input.file.name,
        mimeType: input.file.type,
        sizeBytes: input.file.size,
        category: input.category,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clinicoQueryKeys.attachments(patientId) });
    },
  });
}
