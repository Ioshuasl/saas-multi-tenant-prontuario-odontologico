import type { MemberSummary } from '@/packages/admin/types/Member/MemberTypes';
import type { ProfessionalSummary } from '@/packages/admin/types/Professional/ProfessionalTypes';

export type ProfessionalFormDialogProps = {
  mode: 'create' | 'edit';
  professional?: ProfessionalSummary;
  members: MemberSummary[];
  professionals: ProfessionalSummary[];
  onClose: () => void;
};
