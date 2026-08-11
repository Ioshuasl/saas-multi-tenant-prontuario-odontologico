import { PrismaClient, type Prisma } from '@prisma/client';
import type { RequestContext } from '../domain/request_context.js';

/**
 * Único ponto de acesso ao banco com contexto de tenant (docs/06).
 * Usa set_config(..., true) = SET LOCAL — escopo da transação.
 */
export class TenantPrisma {
  constructor(private readonly prisma: PrismaClient) {}

  async runInTenantContext<T>(
    ctx: RequestContext,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${ctx.tenantId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.user_id', ${ctx.userId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.provisioning', 'off', true)`;
      return fn(tx);
    });
  }

  /** Signup / create tenant — liga flag de provisioning na mesma transação. */
  async runProvisioning<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.provisioning', 'on', true)`;
      return fn(tx);
    });
  }
}

let singleton: PrismaClient | undefined;

export function getPrismaClient(): PrismaClient {
  if (!singleton) {
    singleton = new PrismaClient();
  }
  return singleton;
}

export function getTenantPrisma(): TenantPrisma {
  return new TenantPrisma(getPrismaClient());
}
