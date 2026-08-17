import { ProductionGetData } from '@/packages/financeiro/data/Report/ProductionGetData';
import type { ProductionQuery } from '@/packages/financeiro/types/Report/ReportTypes';

export async function ProductionGetService(query: ProductionQuery) {
  return ProductionGetData(query);
}
