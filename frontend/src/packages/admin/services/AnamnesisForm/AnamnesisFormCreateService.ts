import { AnamnesisFormCreateData } from '@/packages/admin/data/AnamnesisForm/AnamnesisFormCreateData';
import type { AnamnesisFormCreateFormValues } from '@/packages/admin/schemas/AnamnesisForm/AnamnesisFormSchema';

export async function AnamnesisFormCreateService(formSchema: AnamnesisFormCreateFormValues) {
  return AnamnesisFormCreateData(formSchema);
}
