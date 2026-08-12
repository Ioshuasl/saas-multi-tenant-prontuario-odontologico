import { BusinessHoursListData } from '@/packages/admin/data/BusinessHours/BusinessHoursListData';

export async function BusinessHoursListService(unitId: string) {
  return BusinessHoursListData(unitId);
}
