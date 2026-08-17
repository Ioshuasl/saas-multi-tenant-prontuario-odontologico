import { NoShowGetData } from '@/packages/admin/data/Report/NoShowGetData';
import type { ReportPeriodQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function NoShowGetService(query: ReportPeriodQuery = {}) {
  return NoShowGetData(query);
}
