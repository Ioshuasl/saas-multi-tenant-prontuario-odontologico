import {
  BusinessHoursExceptionCreateData,
  type BusinessHoursExceptionCreateInput,
} from '@/packages/admin/data/BusinessHours/BusinessHoursExceptionCreateData';

export async function BusinessHoursExceptionCreateService(
  input: BusinessHoursExceptionCreateInput,
) {
  return BusinessHoursExceptionCreateData(input);
}
