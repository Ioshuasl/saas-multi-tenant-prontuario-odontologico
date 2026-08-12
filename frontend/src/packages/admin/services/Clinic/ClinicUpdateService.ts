import { ClinicUpdateData } from '@/packages/admin/data/Clinic/ClinicUpdateData';
import type { ClinicUpdateFormValues } from '@/packages/admin/schemas/Clinic/ClinicSchema';

export async function ClinicUpdateService(clinicSchema: ClinicUpdateFormValues) {
  return ClinicUpdateData(clinicSchema);
}
