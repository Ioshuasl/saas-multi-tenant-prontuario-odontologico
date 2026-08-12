import { ChairCreateData } from '@/packages/admin/data/Chair/ChairCreateData';
import type { ChairCreateFormValues } from '@/packages/admin/schemas/Chair/ChairSchema';

export async function ChairCreateService(unitId: string, chairSchema: ChairCreateFormValues) {
  return ChairCreateData(unitId, chairSchema);
}
