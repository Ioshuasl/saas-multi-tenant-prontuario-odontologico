import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { formatTime } from '../../helpers/time.helper.js';
import type { ExceptionOverlay, TimeInterval } from '../../helpers/working_windows.helper.js';

export type WorkingWindowsSource = {
  timezone: string;
  unitIntervals: TimeInterval[];
  professionalIntervals: TimeInterval[] | null;
  exceptions: ExceptionOverlay[];
};

export class GetWorkingWindowsSourceRepository {
  async execute(
    ctx: RequestContext,
    input: {
      unitId: string;
      professionalId?: string;
      weekday: number;
      dateYmd: string;
    },
  ): Promise<WorkingWindowsSource | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const tenant = await tx.tenant.findFirst({
        where: { id: ctx.tenantId },
        select: { timezone: true },
      });
      if (!tenant) return null;

      const unit = await tx.unit.findFirst({
        where: { id: input.unitId, tenantId: ctx.tenantId },
        select: { id: true },
      });
      if (!unit) return null;

      if (input.professionalId) {
        const professional = await tx.professional.findFirst({
          where: {
            id: input.professionalId,
            tenantId: ctx.tenantId,
            active: true,
          },
          select: { id: true },
        });
        if (!professional) return null;
      }

      const unitRows = await tx.businessHours.findMany({
        where: {
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          professionalId: null,
          weekday: input.weekday,
        },
        orderBy: { startsAt: 'asc' },
        select: { startsAt: true, endsAt: true },
      });

      let professionalIntervals: TimeInterval[] | null = null;
      if (input.professionalId) {
        const proRows = await tx.businessHours.findMany({
          where: {
            tenantId: ctx.tenantId,
            unitId: input.unitId,
            professionalId: input.professionalId,
            weekday: input.weekday,
          },
          orderBy: { startsAt: 'asc' },
          select: { startsAt: true, endsAt: true },
        });
        if (proRows.length > 0) {
          professionalIntervals = proRows.map((row) => ({
            startsAt: formatTime(row.startsAt),
            endsAt: formatTime(row.endsAt),
          }));
        }
      }

      const exceptionRows = await tx.businessHoursException.findMany({
        where: {
          tenantId: ctx.tenantId,
          unitId: input.unitId,
          date: new Date(`${input.dateYmd}T00:00:00.000Z`),
          OR: [
            { professionalId: null },
            ...(input.professionalId ? [{ professionalId: input.professionalId }] : []),
          ],
        },
        select: { closed: true, startsAt: true, endsAt: true },
      });

      return {
        timezone: tenant.timezone,
        unitIntervals: unitRows.map((row) => ({
          startsAt: formatTime(row.startsAt),
          endsAt: formatTime(row.endsAt),
        })),
        professionalIntervals,
        exceptions: exceptionRows.map((row) => ({
          closed: row.closed,
          startsAt: row.startsAt ? formatTime(row.startsAt) : null,
          endsAt: row.endsAt ? formatTime(row.endsAt) : null,
        })),
      };
    });
  }
}
