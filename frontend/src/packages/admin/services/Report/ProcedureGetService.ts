import { ProcedureGetData } from '@/packages/admin/data/Report/ProcedureGetData';
import type { ReportPeriodQuery } from '@/packages/admin/types/Report/ReportTypes';

export async function ProcedureGetService(query: ReportPeriodQuery = {}) {
  return ProcedureGetData(query);
}
