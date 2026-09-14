import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { ProcedureReportDto, ReportPeriod } from '../../types/report/report.types.js';

export class GetRepository {
  async execute(
    ctx: RequestContext,
    period: ReportPeriod,
    filters: { professionalId?: string; unitId?: string },
  ): Promise<ProcedureReportDto> {
    return getTenantPrisma().runInTenantContext(ctx, async (tx) => {
      const rows = await tx.productionEntry.groupBy({
        by: ['procedureId'],
        where: {
          executedAt: { gte: period.start, lt: period.endExclusive },
          ...(filters.professionalId ? { professionalId: filters.professionalId } : {}),
          ...(filters.unitId ? { unitId: filters.unitId } : {}),
        },
        _count: { _all: true },
        _sum: { amountCents: true },
      });

      const names = rows.length
        ? await tx.procedure.findMany({
            where: { id: { in: rows.map((row) => row.procedureId) } },
            select: { id: true, name: true },
          })
        : [];
      const nameById = new Map(names.map((row) => [row.id, row.name]));

      const items = rows
        .map((row) => ({
          procedureId: row.procedureId,
          procedureName: nameById.get(row.procedureId) ?? 'Procedimento',
          count: row._count._all,
          executedCents: Number(row._sum.amountCents ?? 0n),
        }))
        .sort((a, b) => b.count - a.count || a.procedureName.localeCompare(b.procedureName));

      return { from: period.from, to: period.to, items };
    });
  }
}
