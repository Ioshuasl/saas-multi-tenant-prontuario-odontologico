import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { getPatientById } from '../../../patients/patients_public.js';
import {
  CategoryNotFoundError,
  CategoryNotRevenueError,
  PatientNotFoundError,
  ProceduresCategoryMissingError,
} from '../../models/errors/billing.errors.js';
import { GetRepository as GetCategoryRepository } from '../../repositories/financial_category/financial_category_get.repository.js';
import { GetProceduresRepository } from '../../repositories/financial_category/financial_category_get_procedures.repository.js';
import { CreateRepository } from '../../repositories/receivable/receivable_create.repository.js';
import type { ReceivableCreateSchema } from '../../schemas/billing.schema.js';
import { toJsonCents } from '../../helpers/money.helper.js';

export class CreateAction {
  constructor(
    private readonly create = new CreateRepository(),
    private readonly getCategory = new GetCategoryRepository(),
    private readonly getProcedures = new GetProceduresRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(ctx: RequestContext, receivableSchema: ReceivableCreateSchema) {
    const patient = await getPatientById(ctx, receivableSchema.patientId);
    if (!patient) throw new PatientNotFoundError();
    const unitId = receivableSchema.unitId ?? patient.unitId;

    return this.uow.run(ctx, async ({ tx, publish }) => {
      let categoryId = receivableSchema.categoryId;
      if (categoryId) {
        const category = await this.getCategory.executeInTx(tx, categoryId);
        if (!category) throw new CategoryNotFoundError();
        if (category.kind !== 'REVENUE') throw new CategoryNotRevenueError();
      } else {
        const procedures = await this.getProcedures.executeInTx(tx, ctx.tenantId);
        if (!procedures) throw new ProceduresCategoryMissingError();
        categoryId = procedures.id;
      }

      const created = await this.create.executeInTx(tx, ctx, {
        patientId: receivableSchema.patientId,
        unitId,
        totalCents: BigInt(receivableSchema.totalCents),
        installmentCount: receivableSchema.installmentCount,
        firstDueDate: receivableSchema.firstDueDate,
        downPaymentCents: BigInt(receivableSchema.downPaymentCents ?? 0),
        description: receivableSchema.description ?? null,
        categoryId,
      });

      publish([
        {
          name: 'billing.receivable_created',
          payload: {
            receivableId: created.id,
            patientId: receivableSchema.patientId,
            requestId: ctx.requestId,
          },
        },
      ]);

      return {
        id: created.id,
        totalCents: toJsonCents(created.totalCents),
        downPaymentCents: toJsonCents(created.downPaymentCents),
        installments: created.installments.map((line) => ({
          id: line.id,
          number: line.number,
          dueDate: line.dueDate,
          amountCents: toJsonCents(line.amountCents),
        })),
      };
    });
  }
}
