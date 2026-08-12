import type { MemberSummary } from '@/packages/admin/types/Member/MemberTypes';

export type MemberFormDialogProps = {
  member: MemberSummary;
  onClose: () => void;
};
