import type { FinancialCategoryKind } from '../enum/financial_category/financial_category_kind.enum.js';

export const PROCEDURES_CATEGORY_NAME = 'Procedimentos';

export const DEFAULT_FINANCIAL_CATEGORIES: ReadonlyArray<{
  name: string;
  kind: FinancialCategoryKind;
}> = [
  { name: PROCEDURES_CATEGORY_NAME, kind: 'REVENUE' },
  { name: 'Convênios', kind: 'REVENUE' },
  { name: 'Outras receitas', kind: 'REVENUE' },
  { name: 'Folha e pró-labore', kind: 'EXPENSE' },
  { name: 'Laboratório/prótese', kind: 'EXPENSE' },
  { name: 'Material de consumo', kind: 'EXPENSE' },
  { name: 'Aluguel e condomínio', kind: 'EXPENSE' },
  { name: 'Energia/água/internet', kind: 'EXPENSE' },
  { name: 'Marketing', kind: 'EXPENSE' },
  { name: 'Impostos e taxas', kind: 'EXPENSE' },
  { name: 'Equipamento e manutenção', kind: 'EXPENSE' },
  { name: 'Software e serviços', kind: 'EXPENSE' },
  { name: 'Taxas de cartão', kind: 'EXPENSE' },
  { name: 'Outras despesas', kind: 'EXPENSE' },
];
