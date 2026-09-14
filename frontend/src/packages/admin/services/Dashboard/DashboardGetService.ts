import { DashboardGetData } from '@/packages/admin/data/Dashboard/DashboardGetData';
import type { DashboardQuery } from '@/packages/admin/types/Dashboard/DashboardTypes';

export async function DashboardGetService(query: DashboardQuery = {}) {
  return DashboardGetData(query);
}
