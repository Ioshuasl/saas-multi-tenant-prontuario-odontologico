import type { Prisma } from '@prisma/client';
import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { mapWaitlist } from '../../helpers/waitlist.helper.js';
import type { WaitlistSummary } from '../../types/waitlist.types.js';

const waitlistInclude = {
  patient: { select: { id: true, name: true, phonePrimary: true } },
  professional: {
    select: {
      id: true,
      membership: { select: { user: { select: { name: true } } } },
    },
  },
  procedure: { select: { id: true, name: true, defaultMinutes: true } },
} satisfies Prisma.WaitlistEntryInclude;

export class GetRepository {
  async execute(ctx: RequestContext, waitlistId: string): Promise<WaitlistSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.waitlistEntry.findFirst({
        where: { id: waitlistId, tenantId: ctx.tenantId },
        include: waitlistInclude,
      });
      return row ? mapWaitlist(row) : null;
    });
  }
}
