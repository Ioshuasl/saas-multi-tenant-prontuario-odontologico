import { ChairUpdateData } from '@/packages/admin/data/Chair/ChairUpdateData';
import type { ChairUpdateFormValues } from '@/packages/admin/schemas/Chair/ChairSchema';

export async function ChairUpdateService(
  unitId: string,
  chairId: string,
  chairSchema: ChairUpdateFormValues,
) {
  return ChairUpdateData(unitId, chairId, chairSchema);
}
