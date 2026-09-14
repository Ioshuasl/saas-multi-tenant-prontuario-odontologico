import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { NoShowItemDto, NoShowReportDto, ReportPeriod } from '../../types/report/report.types.js';

export class GetRepository {
  async execute(
    ctx: RequestContext,
    period: ReportPeriod,
    filters: { professionalId?: string; unitId?: string },
  ): Promise<NoShowReportDto> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const rows = await tx.appointment.findMany({
        where: {
          startsAt: { gte: period.start, lt: period.endExclusive },
          status: { in: ['NO_SHOW', 'CANCELLED'] },
          ...(filters.professionalId ? { professionalId: filters.professionalId } : {}),
          ...(filters.unitId ? { unitId: filters.unitId } : {}),
        },
        orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          status: true,
          startsAt: true,
          professionalId: true,
          professional: {
            select: { membership: { select: { user: { select: { name: true } } } } },
          },
          procedure: { select: { name: true, priceCents: true } },
        },
      });

      const items: NoShowItemDto[] = rows.map((row) => {
        const estimatedLossCents =
          row.status === 'NO_SHOW' ? Number(row.procedure?.priceCents ?? 0n) : 0;
        return {
          appointmentId: row.id,
          status: row.status,
          startsAt: row.startsAt.toISOString(),
          professionalId: row.professionalId,
          professionalName: row.professional.membership.user?.name ?? 'Profissional',
          procedureName: row.procedure?.name ?? null,
          estimatedLossCents,
        };
      });

      return {
        from: period.from,
        to: period.to,
        noShowCount: items.filter((item) => item.status === 'NO_SHOW').length,
        cancelledCount: items.filter((item) => item.status === 'CANCELLED').length,
        estimatedLossCents: items.reduce((sum, item) => sum + item.estimatedLossCents, 0),
        items,
      };
    });
  }
}
