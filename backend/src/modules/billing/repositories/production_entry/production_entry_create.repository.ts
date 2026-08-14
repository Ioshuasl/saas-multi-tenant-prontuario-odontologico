import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { CreateProductionEntryInput } from '../../types/receivable/receivable_create.types.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    productionSchema: CreateProductionEntryInput,
  ): Promise<{ id: string }> {
    const id = idGenerator.next();
    await tx.productionEntry.create({
      data: {
        id,
        tenantId: ctx.tenantId,
        unitId: productionSchema.unitId,
        professionalId: productionSchema.professionalId,
        patientId: productionSchema.patientId,
        procedureId: productionSchema.procedureId,
        treatmentItemId: productionSchema.treatmentItemId,
        amountCents: productionSchema.amountCents,
        executedAt: productionSchema.executedAt,
      },
    });
    return { id };
  }
}
