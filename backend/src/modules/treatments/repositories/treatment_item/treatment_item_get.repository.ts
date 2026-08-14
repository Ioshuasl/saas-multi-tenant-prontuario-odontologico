import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { TreatmentItemStatus } from '../../enum/treatment_item/treatment_item_status.enum.js';

export type TreatmentItemRow = {
  id: string;
  treatmentPlanId: string;
  procedureId: string;
  toothCode: string | null;
  face: string | null;
  priceCents: number;
  status: TreatmentItemStatus;
  professionalId: string | null;
  patientId: string;
  planStatus: string;
  quoteId: string | null;
  unitId: string | null;
  procedureCode: string;
  procedureName: string;
  requiresTooth: boolean;
};

const itemInclude = {
  procedure: { select: { code: true, name: true, requiresTooth: true } },
  plan: { include: { quote: { select: { unitId: true } } } },
} as const;

function mapRow(row: {
  id: string;
  treatmentPlanId: string;
  procedureId: string;
  toothCode: string | null;
  face: string | null;
  priceCents: bigint;
  status: string;
  professionalId: string | null;
  procedure: { code: string; name: string; requiresTooth: boolean };
  plan: {
    patientId: string;
    status: string;
    quoteId: string | null;
    quote: { unitId: string } | null;
  };
}): TreatmentItemRow {
  return {
    id: row.id,
    treatmentPlanId: row.treatmentPlanId,
    procedureId: row.procedureId,
    toothCode: row.toothCode,
    face: row.face,
    priceCents: Number(row.priceCents),
    status: row.status as TreatmentItemStatus,
    professionalId: row.professionalId,
    patientId: row.plan.patientId,
    planStatus: row.plan.status,
    quoteId: row.plan.quoteId,
    unitId: row.plan.quote?.unitId ?? null,
    procedureCode: row.procedure.code,
    procedureName: row.procedure.name,
    requiresTooth: row.procedure.requiresTooth,
  };
}

export class GetRepository {
  async execute(ctx: RequestContext, itemId: string): Promise<TreatmentItemRow | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.treatmentItem.findFirst({
        where: { id: itemId },
        include: itemInclude,
      }),
    );
    return row ? mapRow(row) : null;
  }
}
