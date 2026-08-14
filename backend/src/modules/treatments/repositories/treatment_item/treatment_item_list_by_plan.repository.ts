import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import type { TreatmentItemStatus } from '../../enum/treatment_item/treatment_item_status.enum.js';

export class ListByPlanRepository {
  async executeInTx(
    tx: DbTransaction,
    planId: string,
  ): Promise<Array<{ id: string; status: TreatmentItemStatus; priceCents: number }>> {
    const rows = await tx.treatmentItem.findMany({
      where: { treatmentPlanId: planId },
      select: { id: true, status: true, priceCents: true },
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status as TreatmentItemStatus,
      priceCents: Number(row.priceCents),
    }));
  }
}
