import {
  ProfessionalCreateData,
  type ProfessionalCreateInput,
} from '@/packages/admin/data/Professional/ProfessionalCreateData';

export async function ProfessionalCreateService(professionalSchema: ProfessionalCreateInput) {
  return ProfessionalCreateData(professionalSchema);
}
