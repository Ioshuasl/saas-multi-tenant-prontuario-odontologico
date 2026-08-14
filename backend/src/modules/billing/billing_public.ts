import type { RequestContext } from '../../shared/domain/request_context.js';
import type { DbTransaction } from '../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../shared/database/tenant_prisma.js';
import { SeedRepository } from './repositories/financial_category/financial_category_seed.repository.js';
import { CreateFromQuoteRepository } from './repositories/receivable/receivable_create_from_quote.repository.js';
import { CreateRepository as ProductionCreateRepository } from './repositories/production_entry/production_entry_create.repository.js';
import type {
  CreateProductionEntryInput,
  CreateReceivableFromApprovedQuoteInput,
  ReceivableCreated,
} from './types/receivable/receivable_create.types.js';

const seedCategory = new SeedRepository();
const createReceivable = new CreateFromQuoteRepository();
const createProduction = new ProductionCreateRepository();

let failReceivableForQuoteId: string | null = null;

/** Hook de smoke: força throw dentro da TX de aprovação. */
export function setCreateReceivableFailureForTests(quoteId: string | null): void {
  failReceivableForQuoteId = quoteId;
}

/** Seed categoria “Procedimentos” no signup (idempotente). */
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

export type {
  CreateProductionEntryInput,
  CreateReceivableFromApprovedQuoteInput,
  ReceivableCreated,
} from './types/receivable/receivable_create.types.js';
