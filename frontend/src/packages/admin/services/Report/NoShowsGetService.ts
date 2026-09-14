import { NoShowsGetData } from '@/packages/admin/data/Report/NoShowsGetData';
import type { NoShowsQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function NoShowsGetService(query: NoShowsQuery) {
  return NoShowsGetData(query);
}
