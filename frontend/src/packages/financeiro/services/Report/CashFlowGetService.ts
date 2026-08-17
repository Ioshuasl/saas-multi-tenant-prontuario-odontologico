import { CashFlowGetData } from '@/packages/financeiro/data/Report/CashFlowGetData';
import type { CashFlowQuery } from '@/packages/financeiro/types/Report/ReportTypes';

export async function CashFlowGetService(query: CashFlowQuery) {
  return CashFlowGetData(query);
}
