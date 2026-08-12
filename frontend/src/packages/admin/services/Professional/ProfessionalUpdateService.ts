import {
  ProfessionalUpdateData,
  type ProfessionalUpdateInput,
} from '@/packages/admin/data/Professional/ProfessionalUpdateData';

export async function ProfessionalUpdateService(
  professionalId: string,
  professionalSchema: ProfessionalUpdateInput,
) {
  return ProfessionalUpdateData(professionalId, professionalSchema);
}
