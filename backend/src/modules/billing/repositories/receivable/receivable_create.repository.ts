import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { installmentDueDates } from '../../helpers/installment_due_dates.helper.js';
import { splitInstallments } from '../../helpers/split_installments.helper.js';
import type { ReceivableCreated } from '../../types/receivable/receivable_create.types.js';

export type CreateManualReceivableInput = {
  patientId: string;
  unitId: string;
  totalCents: bigint;
  installmentCount: number;
  firstDueDate: string;
  downPaymentCents: bigint;
  description?: string | null;
  categoryId: string;
};

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    receivableSchema: CreateManualReceivableInput,
  ): Promise<ReceivableCreated> {
    const amounts = splitInstallments(
      receivableSchema.totalCents,
      receivableSchema.installmentCount,
      receivableSchema.downPaymentCents,
    );
    const dueDates = installmentDueDates(
      receivableSchema.firstDueDate,
      receivableSchema.installmentCount,
    );
    const receivableId = idGenerator.next();

    await tx.receivable.create({
      data: {
        id: receivableId,
        tenantId: ctx.tenantId,
        unitId: receivableSchema.unitId,
        patientId: receivableSchema.patientId,
        totalCents: receivableSchema.totalCents,
        installmentCount: receivableSchema.installmentCount,
        status: 'OPEN',
        categoryId: receivableSchema.categoryId,
        description: receivableSchema.description ?? null,
      },
    });

    const lines: ReceivableCreated['installments'] = [];
    for (let i = 0; i < amounts.length; i += 1) {
      const installmentId = idGenerator.next();
      const dueDate = dueDates[i]!;
      const amountCents = amounts[i]!;
      await tx.installment.create({
        data: {
          id: installmentId,
          tenantId: ctx.tenantId,
          receivableId,
          number: i + 1,
          dueDate: new Date(`${dueDate}T00:00:00.000Z`),
          amountCents,
          status: 'OPEN',
        },
      });
      lines.push({ id: installmentId, number: i + 1, dueDate, amountCents });
    }

    return {
      id: receivableId,
      totalCents: receivableSchema.totalCents,
      downPaymentCents: receivableSchema.downPaymentCents,
      installments: lines,
    };
  }
}
