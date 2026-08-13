import type { AttachmentSummary } from '@/packages/clinico/types/Attachment/AttachmentTypes';

export type AttachmentDeleteFormDialogProps = {
  attachment: AttachmentSummary;
  onClose: () => void;
};
