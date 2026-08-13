import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { MedicalRecordNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { CreateRepository } from '../../repositories/clinical_alert/clinical_alert_create.repository.js';
import type { ClinicalAlertCreateSchema } from '../../schemas/clinical_alert.schema.js';
import type { ClinicalAlertSummary } from '../../types/medical_record/medical_record_get.types.js';

export class CreateAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly getRecordId = new GetIdRepository(),
    private readonly createAlert = new CreateRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    alertSchema: ClinicalAlertCreateSchema,
  ): Promise<ClinicalAlertSummary> {
    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const alertId = idGenerator.next();

    await this.uow.run(ctx, async ({ tx, publish }) => {
      await this.createAlert.executeInTx(tx, ctx, {
        id: alertId,
        medicalRecordId,
        severity: alertSchema.severity,
        category: alertSchema.category,
        description: alertSchema.description,
        source: 'MANUAL',
      });
      if (alertSchema.severity === 'CRITICAL') {
        publish([
          {
            name: 'clinical_records.critical_alert_created',
            payload: {
              alertId,
              patientId,
              medicalRecordId,
              requestId: ctx.requestId,
            },
          },
        ]);
      }
    });

    return {
      id: alertId,
      severity: alertSchema.severity,
      category: alertSchema.category,
      description: alertSchema.description,
      source: 'MANUAL',
      active: true,
    };
  }
}
