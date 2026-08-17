export const FINANCIAL_CATEGORY_KINDS = ['REVENUE', 'EXPENSE'] as const;

export type FinancialCategoryKind = (typeof FINANCIAL_CATEGORY_KINDS)[number];
