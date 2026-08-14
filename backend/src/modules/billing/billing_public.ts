import type { RequestContext } from '../../shared/domain/request_context.js';
import type { DbTransaction } from '../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../shared/database/tenant_prisma.js';
import { SeedRepository } from './repositories/financial_category/financial_category_seed.repository.js';
import { CreateFromQuoteRepository } from './repositories/receivable/receivable_create_from_quote.repository.js';
import { CreateRepository as ProductionCreateRepository } from './repositories/production_entry/production_entry_create.repository.js';
import { HasOverdueRepository } from './repositories/installment/installment_overdue.repository.js';
import { tenantToday } from './helpers/tenant_today.helper.js';
import type {
  CreateProductionEntryInput,
  CreateReceivableFromApprovedQuoteInput,
  ReceivableCreated,
} from './types/receivable/receivable_create.types.js';

const seedCategory = new SeedRepository();
const createReceivable = new CreateFromQuoteRepository();
const createProduction = new ProductionCreateRepository();
const hasOverdue = new HasOverdueRepository();

let failReceivableForQuoteId: string | null = null;

/** Hook de smoke: força throw dentro da TX de aprovação. */
export function setCreateReceivableFailureForTests(quoteId: string | null): void {
  failReceivableForQuoteId = quoteId;
}

/** Seed categorias E7 (Procedimentos + receitas/despesas) no signup (idempotente). */
export async function seedDefaultFinancialCategories(
  tx: DbTransaction,
  input: { tenantId: string; idNext: () => string },
): Promise<void> {
  await seedCategory.executeInTx(tx, input);
}

/**
 * Cria título + parcelas na mesma transação do caller (DecideQuote).
 * `billing` não importa `treatments`.
 */
export async function createReceivableFromApprovedQuote(
  ctx: RequestContext,
  receivableSchema: CreateReceivableFromApprovedQuoteInput,
  tx?: DbTransaction,
): Promise<ReceivableCreated> {
  if (failReceivableForQuoteId && receivableSchema.quoteId === failReceivableForQuoteId) {
    throw new Error('billing stub fail');
  }
  if (tx) return createReceivable.executeInTx(tx, ctx, receivableSchema);
  return getTenantPrisma().runInTenantContext(ctx, (inner) =>
    createReceivable.executeInTx(inner, ctx, receivableSchema),
  );
}

export async function createProductionEntry(
  ctx: RequestContext,
  productionSchema: CreateProductionEntryInput,
  tx?: DbTransaction,
): Promise<{ id: string }> {
  if (tx) return createProduction.executeInTx(tx, ctx, productionSchema);
  return getTenantPrisma().runInTenantContext(ctx, (inner) =>
    createProduction.executeInTx(inner, ctx, productionSchema),
  );
}

/** Há parcela vencida (OVERDUE ou aberta com due_date < hoje TZ). Usado por scheduling (RF-E7-19). */
export async function patientHasOverdue(ctx: RequestContext, patientId: string): Promise<boolean> {
  const today = await tenantToday(ctx);
  return hasOverdue.execute(ctx, patientId, today);
}

export type {
  CreateProductionEntryInput,
  CreateReceivableFromApprovedQuoteInput,
  ReceivableCreated,
} from './types/receivable/receivable_create.types.js';
