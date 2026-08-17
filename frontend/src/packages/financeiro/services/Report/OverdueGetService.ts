import { OverdueGetData } from '@/packages/financeiro/data/Report/OverdueGetData';

export async function OverdueGetService(unitId?: string) {
  return OverdueGetData(unitId);
}
