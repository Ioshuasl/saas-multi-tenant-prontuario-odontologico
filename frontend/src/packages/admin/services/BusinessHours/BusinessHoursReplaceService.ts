import {
  BusinessHoursReplaceData,
  type BusinessHoursReplaceInput,
} from '@/packages/admin/data/BusinessHours/BusinessHoursReplaceData';

export async function BusinessHoursReplaceService(input: BusinessHoursReplaceInput) {
  return BusinessHoursReplaceData(input);
}
