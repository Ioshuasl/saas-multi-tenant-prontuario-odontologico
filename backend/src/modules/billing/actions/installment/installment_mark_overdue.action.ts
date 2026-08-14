import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { setPatientHasOverdue } from '../../../patients/patients_public.js';
import {
  HasOverdueRepository,
  ListDueOpenRepository,
  MarkOverdueRepository,
} from '../../repositories/installment/installment_overdue.repository.js';
import { tenantToday } from '../../helpers/tenant_today.helper.js';

export class MarkOverdueAction {
  constructor(
    private readonly listDue = new ListDueOpenRepository(),
    private readonly mark = new MarkOverdueRepository(),
    private readonly hasOverdue = new HasOverdueRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(ctx: RequestContext): Promise<number> {
    const today = await tenantToday(ctx);
    return this.uow.run(ctx, async ({ tx, publish }) => {
      const due = await this.listDue.executeInTx(tx, today);
      if (due.length === 0) return 0;
      const ids = due.map((row) => row.id);
      const count = await this.mark.executeInTx(tx, ids);
      const patientIds = [...new Set(due.map((row) => row.receivable.patientId))];
      for (const patientId of patientIds) {
        const overdue = await this.hasOverdue.executeInTx(tx, patientId, today);
        await setPatientHasOverdue(ctx, patientId, overdue, tx);
      }
      publish(
        due.map((row) => ({
          name: 'billing.installment_overdue',
          payload: {
            installmentId: row.id,
            patientId: row.receivable.patientId,
            requestId: ctx.requestId,
          },
        })),
      );
      return count;
    });
  }
}
