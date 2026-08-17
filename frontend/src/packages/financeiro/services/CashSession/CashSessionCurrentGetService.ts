import { CashSessionCurrentGetData } from '@/packages/financeiro/data/CashSession/CashSessionCurrentGetData';

export async function CashSessionCurrentGetService(unitId: string) {
  return CashSessionCurrentGetData(unitId);
}
