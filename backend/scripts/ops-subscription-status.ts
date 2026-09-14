/**
 * Ops: altera status da assinatura (ACTIVE/SUSPENDED/…) de forma auditada.
 * Uso: pnpm --filter @repo/backend exec tsx scripts/ops-subscription-status.ts <tenantId> <STATUS> [reason]
 * ADR-0010 — sem checkout/gateway.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { getPrismaClient } from '../src/shared/database/tenant_prisma.js';
import { AuditAction, writeAuditLog } from '../src/shared/database/write_audit.js';
import { disableAllAutomations } from '../src/modules/messaging/messaging_public.js';
import {
  OPS_SUBSCRIPTION_STATUSES,
  READ_ONLY_SUBSCRIPTION_STATUSES,
} from '../src/modules/subscription/enum/subscription/subscription_status.enum.js';
import { UpdateStatusRepository } from '../src/modules/subscription/repositories/subscription/subscription_update_status.repository.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

async function main() {
  const tenantId = process.argv[2];
  const status = process.argv[3];
  const reason = process.argv[4] ?? 'ops-cli';

  if (!tenantId || !status) {
    console.error(
      'Uso: tsx scripts/ops-subscription-status.ts <tenantId> <STATUS> [reason]',
    );
    console.error(`STATUS ∈ ${OPS_SUBSCRIPTION_STATUSES.join('|')}`);
    process.exit(1);
  }

  if (!(OPS_SUBSCRIPTION_STATUSES as readonly string[]).includes(status)) {
    console.error(`Status inválido: ${status}`);
    process.exit(1);
  }

  const ctx = {
    tenantId,
    userId: '00000000-0000-0000-0000-000000000000',
    requestId: `ops-subscription-status:${Date.now()}`,
  };

  const update = new UpdateStatusRepository();
  const updated = await update.execute(ctx, status);
  if (!updated) {
    console.error('Assinatura não encontrada para o tenant.');
    process.exit(1);
  }

  if (READ_ONLY_SUBSCRIPTION_STATUSES.has(status)) {
    await disableAllAutomations(ctx);
  }

  await writeAuditLog({
    tenantId,
    actorType: 'SYSTEM',
    action: AuditAction.SUBSCRIPTION_STATUS_CHANGED,
    resourceType: 'subscription',
    resourceId: updated.id,
    metadata: { status, reason, source: 'ops-cli' },
  });

  console.info(`OK: tenant ${tenantId} → ${status}`);
  await getPrismaClient().$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await getPrismaClient().$disconnect();
  process.exit(1);
});
