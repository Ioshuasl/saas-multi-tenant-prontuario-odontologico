import { ProceduresGetData } from '@/packages/admin/data/Report/ProceduresGetData';
import type { ProceduresQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function ProceduresGetService(query: ProceduresQuery) {
  return ProceduresGetData(query);
}
