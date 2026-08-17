import { config } from 'dotenv';
import { resolve } from 'node:path';
import { getPrismaClient } from '../src/shared/database/tenant_prisma.js';
import { CreateService } from '../src/modules/platform/services/support_access/support_access_create.service.js';
import { GetService } from '../src/modules/platform/services/support_access/support_access_get.service.js';
import { ApproveService } from '../src/modules/platform/services/support_access/support_access_approve.service.js';

config({ path: resolve(process.cwd(), '../.env') });
config({ path: resolve(process.cwd(), '.env') });

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((item) => item.startsWith(prefix));
  if (found) return found.slice(prefix.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0) return process.argv[idx + 1];
  return undefined;
}

function usage(): never {
  console.error(
    [
      'Uso:',
      '  tsx scripts/ops-support-access.ts request --tenant <uuid> --requester <uuid> --reason "<min 20 chars>" [--hours 4]',
      '  tsx scripts/ops-support-access.ts approve --id <uuid> --approver <uuid>',
      '  tsx scripts/ops-support-access.ts get --id <uuid>',
    ].join('\n'),
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const command = process.argv[2];
  if (command === 'request') {
    const tenantId = arg('tenant');
    const requester = arg('requester');
    const reason = arg('reason');
    const hoursRaw = arg('hours');
    if (!tenantId || !requester || !reason) usage();
    const hours = hoursRaw ? Number(hoursRaw) : undefined;
    const row = await new CreateService().execute(
      { tenantId, userId: requester, requestId: 'ops-support-access' },
      { tenantId, reason, hours },
    );
    console.log(JSON.stringify(row));
  } else if (command === 'approve') {
    const id = arg('id');
    const approver = arg('approver');
    if (!id || !approver) usage();
    const row = await new ApproveService().execute(
      { tenantId: '00000000-0000-0000-0000-000000000000', userId: approver, requestId: 'ops-support-access' },
      id,
    );
    console.log(JSON.stringify(row));
  } else if (command === 'get') {
    const id = arg('id');
    if (!id) usage();
    const row = await new GetService().execute(id);
    console.log(JSON.stringify(row));
  } else {
    usage();
  }

  await getPrismaClient().$disconnect();
}

void main().catch(async (err) => {
  console.error(err);
  await getPrismaClient().$disconnect();
  process.exit(1);
});
