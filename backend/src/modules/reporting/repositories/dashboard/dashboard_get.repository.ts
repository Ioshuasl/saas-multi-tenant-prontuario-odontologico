import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import {
  addDaysYmd,
  civilDateUtc,
  civilStartUtc,
  monthEndYmd,
  monthStartYmd,
  nextMonthStartYmd,
} from '../../helpers/civil_date.helper.js';
import { tenantTimezone } from '../../helpers/reporting_period.helper.js';
import type { DashboardDto, DashboardQuery } from '../../types/report/report.types.js';

const OPEN_RECEIVABLE = ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'];

export class GetRepository {
  async execute(ctx: RequestContext, query: DashboardQuery): Promise<DashboardDto> {
    const timezone = await tenantTimezone(ctx);
    const date = query.date;
    const dayStart = civilStartUtc(date, timezone);
    const dayEnd = civilStartUtc(addDaysYmd(date, 1), timezone);
    const monthFrom = monthStartYmd(date);
    const monthStart = civilStartUtc(monthFrom, timezone);
    const monthEnd = civilStartUtc(nextMonthStartYmd(date), timezone);
    const monthTo = monthEndYmd(date);
    const dueToday = civilDateUtc(date);

    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const appointments = await tx.appointment.groupBy({
        by: ['status'],
        where: {
          startsAt: { gte: dayStart, lt: dayEnd },
          ...(query.unitId ? { unitId: query.unitId } : {}),
          ...(query.professionalId ? { professionalId: query.professionalId } : {}),
        },
        _count: { _all: true },
      });

      const byStatus: Record<string, number> = {};
      let total = 0;
      for (const row of appointments) {
        byStatus[row.status] = row._count._all;
        total += row._count._all;
      }

      let receivableToday: DashboardDto['receivableToday'] = null;
      let receivedToday: DashboardDto['receivedToday'] = null;

      if (query.includeFinancial) {
        const due = await tx.installment.findMany({
          where: {
            dueDate: dueToday,
            status: { in: OPEN_RECEIVABLE },
            ...(query.unitId ? { receivable: { unitId: query.unitId } } : {}),
          },
          select: { amountCents: true, paidCents: true },
        });
        let amountCents = 0;
        for (const row of due) {
          amountCents += Number(row.amountCents - row.paidCents);
        }
        receivableToday = { count: due.length, amountCents };

        const paid = await tx.payment.aggregate({
          where: {
            reversedAt: null,
            receivedAt: { gte: dayStart, lt: dayEnd },
            ...(query.unitId ? { unitId: query.unitId } : {}),
          },
          _sum: { amountCents: true },
          _count: { _all: true },
        });
        receivedToday = {
          count: paid._count._all,
          amountCents: Number(paid._sum.amountCents ?? 0n),
        };
      }

      const noShows = await tx.appointment.count({
        where: {
          status: 'NO_SHOW',
          startsAt: { gte: monthStart, lt: monthEnd },
          ...(query.unitId ? { unitId: query.unitId } : {}),
          ...(query.professionalId ? { professionalId: query.professionalId } : {}),
        },
      });

      const production = await tx.productionEntry.aggregate({
        where: {
          executedAt: { gte: monthStart, lt: monthEnd },
          ...(query.unitId ? { unitId: query.unitId } : {}),
          ...(query.professionalId ? { professionalId: query.professionalId } : {}),
        },
        _sum: { amountCents: true },
      });

      return {
        date,
        timezone,
        agenda: { total, byStatus },
        receivableToday,
        receivedToday,
        noShowsMonth: { count: noShows },
        productionMonth: { executedCents: Number(production._sum.amountCents ?? 0n) },
        hrefs: {
          agenda: `/app/agenda?date=${date}`,
          receivableToday: '/app/relatorios/overdue',
          receivedToday: `/app/relatorios/cash-flow?from=${date}&to=${date}`,
          noShowsMonth: `/app/relatorios/no-shows?from=${monthFrom}&to=${monthTo}`,
          productionMonth: `/app/relatorios/production?from=${monthFrom}&to=${monthTo}`,
        },
      };
    });
  }
}
