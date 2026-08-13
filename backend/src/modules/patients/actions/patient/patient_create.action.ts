import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { ensureRecord } from '../../../clinical_records/clinical_records_public.js';
import {
  CreatePatientRepository,
  type CreatePatientInput,
} from '../../repositories/patient/patient.repository.js';
import type { PatientDetail, PatientWarning } from '../../types/patients.types.js';

export class CreateAction {
  constructor(
    private readonly create = new CreatePatientRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientSchema: CreatePatientInput,
    warnings: PatientWarning[],
  ): Promise<PatientDetail> {
    return this.uow.run(ctx, async ({ tx, publish }) => {
      const patient = await this.create.executeInTx(tx, ctx, patientSchema, warnings);
      await ensureRecord(ctx, patient.id, tx);
      publish([
        {
          name: 'patients.patient_created',
          payload: { patientId: patient.id, requestId: ctx.requestId },
        },
      ]);
      return patient;
    });
  }
}
