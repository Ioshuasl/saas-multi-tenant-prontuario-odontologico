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

export class UpdateRepository {
  async execute(
    ctx: RequestContext,
    waitlistId: string,
    patch: {
      status?: string;
      offeredAt?: Date | null;
      expiresAt?: Date | null;
    },
  ): Promise<WaitlistSummary | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const existing = await tx.waitlistEntry.findFirst({
        where: { id: waitlistId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!existing) return null;

      const row = await tx.waitlistEntry.update({
        where: { id: waitlistId },
        data: {
          ...(patch.status !== undefined ? { status: patch.status } : {}),
          ...(patch.offeredAt !== undefined ? { offeredAt: patch.offeredAt } : {}),
          ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
        },
        include: waitlistInclude,
      });
      return mapWaitlist(row);
    });
  }
}

export class UpdateManyStatusRepository {
  async execute(
    ctx: RequestContext,
    waitlistIds: string[],
    status: string,
  ): Promise<number> {
    if (waitlistIds.length === 0) return 0;
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const result = await tx.waitlistEntry.updateMany({
        where: { tenantId: ctx.tenantId, id: { in: waitlistIds } },
        data: { status },
      });
      return result.count;
    });
  }
}
