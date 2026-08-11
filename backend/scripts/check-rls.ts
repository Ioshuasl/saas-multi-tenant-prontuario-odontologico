import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { TenantPrisma } from '../src/shared/database/tenant_prisma.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

/**
 * Verifica isolamento RLS com o role app_user (sem BYPASSRLS).
 * Uso: pnpm test:rls (DATABASE_URL deve ser app_user)
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL obrigatório');
  if (url.includes('postgres:postgres') || url.includes('app_migrator')) {
    console.warn(
      'Aviso: DATABASE_URL parece superuser/migrator — RLS pode ser bypassada. Use app_user.',
    );
  }

  const prisma = new PrismaClient();
  const tenantDb = new TenantPrisma(prisma);

  const tenantA = randomUUID();
  const tenantB = randomUUID();

  await tenantDb.runProvisioning(async (tx) => {
    await tx.tenant.create({
      data: {
        id: tenantA,
        name: 'Clinica A',
        slug: `clinica-a-${tenantA.slice(0, 8)}`,
        updatedAt: new Date(),
      },
    });
    await tx.tenant.create({
      data: {
        id: tenantB,
        name: 'Clinica B',
        slug: `clinica-b-${tenantB.slice(0, 8)}`,
        updatedAt: new Date(),
      },
    });
  });

  const ctxA = { tenantId: tenantA, userId: randomUUID(), requestId: randomUUID() };
  const ctxB = { tenantId: tenantB, userId: randomUUID(), requestId: randomUUID() };

  await tenantDb.runInTenantContext(ctxA, async (tx) => {
    await tx.auditLog.create({
      data: {
        id: randomUUID(),
        tenantId: tenantA,
        actorType: 'SYSTEM',
        action: 'CREATE',
        resourceType: 'tenant',
        resourceId: tenantA,
      },
    });
  });

  const visibleToA = await tenantDb.runInTenantContext(ctxA, async (tx) =>
    tx.auditLog.findMany(),
  );
  const visibleToB = await tenantDb.runInTenantContext(ctxB, async (tx) =>
    tx.auditLog.findMany(),
  );
  const withoutCtx = await prisma.auditLog.findMany();

  const tablesWithoutRls = await prisma.$queryRaw<{ relname: string }[]>`
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN information_schema.columns col
      ON col.table_name = c.relname AND col.column_name = 'tenant_id'
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  `;

  let failed = false;

  if (visibleToA.length !== 1) {
    console.error('FAIL: tenant A deveria ver 1 audit_log, viu', visibleToA.length);
    failed = true;
  }
  if (visibleToB.length !== 0) {
    console.error('FAIL: tenant B deveria ver 0 audit_log, viu', visibleToB.length);
    failed = true;
  }
  if (withoutCtx.length !== 0) {
    console.error(
      'FAIL: sem contexto app.tenant_id deveria ver 0 (app_user); viu',
      withoutCtx.length,
    );
    failed = true;
  }
  if (tablesWithoutRls.length !== 0) {
    console.error(
      'FAIL: tabelas com tenant_id sem RLS:',
      tablesWithoutRls.map((t) => t.relname).join(', '),
    );
    failed = true;
  }

  // INSERT com tenant_id divergente do contexto deve falhar (WITH CHECK)
  try {
    await tenantDb.runInTenantContext(ctxA, async (tx) => {
      await tx.auditLog.create({
        data: {
          id: randomUUID(),
          tenantId: tenantB,
          actorType: 'SYSTEM',
          action: 'CREATE',
          resourceType: 'tenant',
        },
      });
    });
    console.error('FAIL: INSERT cross-tenant deveria falhar');
    failed = true;
  } catch {
    // esperado
  }

  await prisma.$disconnect();

  if (failed) {
    process.exit(1);
  }
  console.log('OK: RLS isolation checks passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
