import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { civilDateUtc } from '../../helpers/civil_date.helper.js';
import { dateOnly } from '../../helpers/money.helper.js';
import { AGING_BANDS } from '../../enum/report/aging_band.enum.js';
import { agingBand, calendarDaysBetween, effectiveInstallmentStatus } from '../../models/overdue.model.js';
import type { OverdueReportQuerySchema } from '../../schemas/billing.schema.js';
import type { OverdueItemDto, OverdueReportDto } from '../../types/report/report.types.js';

export class GetRepository {
  async execute(
    ctx: RequestContext,
    query: OverdueReportQuerySchema,
    today: string,
  ): Promise<OverdueReportDto> {
    const todayDate = civilDateUtc(today);
    const rows = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.installment.findMany({
        where: {
          status: { in: ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'] },
          receivable: {
            ...(query.unitId ? { unitId: query.unitId } : {}),
            ...(query.professionalId
              ? {
                  OR: [
                    { quote: { professionalId: query.professionalId } },
                    {
                      treatmentPlan: {
                        items: { some: { professionalId: query.professionalId } },
                      },
                    },
                  ],
                }
              : {}),
          },
        },
        include: {
          receivable: {
            select: { id: true, patientId: true, patient: { select: { code: true } } },
          },
        },
      }),
    );

    const buckets = new Map<string, OverdueItemDto[]>(AGING_BANDS.map((band) => [band, []]));
    for (const row of rows) {
      const due = dateOnly(row.dueDate);
      const status = effectiveInstallmentStatus(row.status as 'OPEN' | 'PARTIALLY_PAID' | 'OVERDUE' | 'PAID' | 'CANCELLED', due, today);
      if (status !== 'OVERDUE') continue;
      if (row.dueDate >= todayDate && row.status !== 'OVERDUE') continue;
      const remaining = row.amountCents - row.paidCents;
      if (remaining <= 0n) continue;
      const days = calendarDaysBetween(due, today);
      const band = agingBand(days);
      if (!band) continue;
      buckets.get(band)?.push({
        installmentId: row.id,
        receivableId: row.receivable.id,
        patientId: row.receivable.patientId,
        patientCode: Number(row.receivable.patient.code),
        dueDate: due,
        remainingCents: Number(remaining),
        daysOverdue: days,
      });
    }

    return {
      buckets: AGING_BANDS.map((band) => {
        const items = buckets.get(band) ?? [];
        return {
          band,
          count: items.length,
          totalCents: items.reduce((sum, item) => sum + item.remainingCents, 0),
          items,
        };
      }),
    };
  }
}
