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

export class ListRepository {
  async execute(
    ctx: RequestContext,
    filter?: { status?: string; professionalId?: string; procedureId?: string },
  ): Promise<WaitlistSummary[]> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const rows = await tx.waitlistEntry.findMany({
        where: {
          tenantId: ctx.tenantId,
          ...(filter?.status ? { status: filter.status } : {}),
          ...(filter?.professionalId ? { professionalId: filter.professionalId } : {}),
          ...(filter?.procedureId ? { procedureId: filter.procedureId } : {}),
        },
        include: waitlistInclude,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: 200,
      });
      return rows.map(mapWaitlist);
    });
  }
}
