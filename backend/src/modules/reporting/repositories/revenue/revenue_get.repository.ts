import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { formatYmdInTz } from '../../helpers/civil_date.helper.js';
import { tenantTimezone } from '../../helpers/reporting_period.helper.js';
import type { RevenueGroupBy } from '../../enum/report/revenue_group_by.enum.js';
import type { ReportPeriod, RevenueItemDto, RevenueReportDto } from '../../types/report/report.types.js';

export class GetRepository {
  async execute(
    ctx: RequestContext,
    period: ReportPeriod,
    groupBy: RevenueGroupBy,
    filters: { unitId?: string },
  ): Promise<RevenueReportDto> {
    const timezone = await tenantTimezone(ctx);

    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      if (groupBy === 'professional') {
        const entries = await tx.productionEntry.findMany({
          where: {
            executedAt: { gte: period.start, lt: period.endExclusive },
            ...(filters.unitId ? { unitId: filters.unitId } : {}),
          },
          select: {
            amountCents: true,
            professionalId: true,
            professional: {
              select: { membership: { select: { user: { select: { name: true } } } } },
            },
          },
        });

        const grouped = new Map<string, RevenueItemDto>();
        for (const entry of entries) {
          const name = entry.professional.membership.user?.name ?? 'Profissional';
          const current = grouped.get(entry.professionalId);
          const cents = Number(entry.amountCents);
          if (!current) {
            grouped.set(entry.professionalId, {
              key: entry.professionalId,
              amountCents: cents,
              count: 1,
              professionalId: entry.professionalId,
              professionalName: name,
            });
            continue;
          }
          current.amountCents += cents;
          current.count += 1;
        }

        const items = [...grouped.values()];
        return {
          from: period.from,
          to: period.to,
          groupBy,
          totalCents: items.reduce((sum, item) => sum + item.amountCents, 0),
          count: items.reduce((sum, item) => sum + item.count, 0),
          items,
        };
      }

      const payments = await tx.payment.findMany({
        where: {
          reversedAt: null,
          receivedAt: { gte: period.start, lt: period.endExclusive },
          ...(filters.unitId ? { unitId: filters.unitId } : {}),
        },
        select: { amountCents: true, receivedAt: true },
      });

      const grouped = new Map<string, RevenueItemDto>();
      for (const payment of payments) {
        const ymd = formatYmdInTz(payment.receivedAt, timezone);
        const key = groupBy === 'month' ? ymd.slice(0, 7) : ymd;
        const cents = Number(payment.amountCents);
        const current = grouped.get(key);
        if (!current) {
          grouped.set(key, { key, amountCents: cents, count: 1 });
          continue;
        }
        current.amountCents += cents;
        current.count += 1;
      }

      const items = [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key));
      return {
        from: period.from,
        to: period.to,
        groupBy,
        totalCents: items.reduce((sum, item) => sum + item.amountCents, 0),
        count: items.reduce((sum, item) => sum + item.count, 0),
        items,
      };
    });
  }
}
