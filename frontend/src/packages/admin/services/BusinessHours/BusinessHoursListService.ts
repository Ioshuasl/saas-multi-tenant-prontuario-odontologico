import { BusinessHoursListData } from '@/packages/admin/data/BusinessHours/BusinessHoursListData';

export async function BusinessHoursListService(
  unitId: string,
  professionalId?: string | null,
) {
  return BusinessHoursListData(unitId, professionalId);
}
