import { ChairListData } from '@/packages/admin/data/Chair/ChairListData';

export async function ChairListService(unitId: string) {
  return ChairListData(unitId);
}
