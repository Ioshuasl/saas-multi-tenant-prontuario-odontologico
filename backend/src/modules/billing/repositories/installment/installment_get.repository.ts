import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import type { InstallmentStatus } from '../../enum/installment/installment_status.enum.js';

export type InstallmentChargeRow = {
  id: string;
  receivableId: string;
  patientId: string;
  unitId: string;
  number: number;
  dueDate: Date;
  amountCents: bigint;
  paidCents: bigint;
  status: InstallmentStatus;
};

export class GetRepository {
  async execute(ctx: RequestContext, installmentId: string): Promise<InstallmentChargeRow | null> {
    const row = await getTenantPrisma().runInTenantContext(ctx, (tx) =>
      tx.installment.findFirst({
        where: { id: installmentId },
        include: { receivable: { select: { patientId: true, unitId: true } } },
      }),
    );
    if (!row) return null;
    return {
      id: row.id,
      receivableId: row.receivableId,
      patientId: row.receivable.patientId,
      unitId: row.receivable.unitId,
      number: row.number,
      dueDate: row.dueDate,
      amountCents: row.amountCents,
      paidCents: row.paidCents,
      status: row.status as InstallmentStatus,
    };
  }
}
