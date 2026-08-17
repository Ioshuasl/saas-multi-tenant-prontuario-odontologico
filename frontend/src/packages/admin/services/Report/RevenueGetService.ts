import { RevenueGetData } from '@/packages/admin/data/Report/RevenueGetData';
import type { RevenueQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function RevenueGetService(query: RevenueQuery = {}) {
  return RevenueGetData(query);
}
