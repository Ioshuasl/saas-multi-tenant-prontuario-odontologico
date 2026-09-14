import { DashboardGetData } from '@/packages/admin/data/Report/DashboardGetData';
import type { DashboardQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function DashboardGetService(query: DashboardQuery = {}) {
  return DashboardGetData(query);
}
