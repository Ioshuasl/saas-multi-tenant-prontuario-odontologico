import type { FinancialCategoryKind } from '../../enum/financial_category/financial_category_kind.enum.js';

export type FinancialCategoryDto = {
  id: string;
  name: string;
  kind: FinancialCategoryKind;
  parentId: string | null;
  active: boolean;
};
