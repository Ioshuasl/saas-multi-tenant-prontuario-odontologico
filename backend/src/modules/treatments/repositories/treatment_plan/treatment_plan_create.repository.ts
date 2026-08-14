import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { QuoteItemDto } from '../../types/quote/quote_crud.types.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    planSchema: {
      patientId: string;
      quoteId: string;
      professionalId: string;
      items: QuoteItemDto[];
    },
  ): Promise<{ planId: string; itemCount: number }> {
    const planId = idGenerator.next();
    await tx.treatmentPlan.create({
      data: {
        id: planId,
        tenantId: ctx.tenantId,
        patientId: planSchema.patientId,
        quoteId: planSchema.quoteId,
        status: 'ACTIVE',
        items: {
          create: planSchema.items.map((item) => ({
            id: idGenerator.next(),
            tenantId: ctx.tenantId,
            procedureId: item.procedureId,
            quoteItemId: item.id,
            toothCode: item.toothCode,
            face: item.face,
            priceCents: BigInt(item.totalCents),
            status: 'PLANNED',
            professionalId: planSchema.professionalId,
          })),
        },
      },
    });
    return { planId, itemCount: planSchema.items.length };
  }
}
