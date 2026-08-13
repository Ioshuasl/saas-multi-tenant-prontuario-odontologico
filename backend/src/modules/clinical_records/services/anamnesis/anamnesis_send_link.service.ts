import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { SendLinkAction } from '../../actions/anamnesis/anamnesis_send_link.action.js';
import {
  MedicalRecordNotFoundError,
  PatientNotFoundForRecordError,
} from '../../models/errors/clinical_records.errors.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { GetRepository as GetPatientSnapshotRepository } from '../../repositories/patient_snapshot/patient_snapshot_get.repository.js';
import type { AnamnesisSendLinkSchema } from '../../schemas/anamnesis.schema.js';
import type { AnamnesisSendLinkResult } from '../../types/anamnesis/anamnesis_send_link.types.js';

export class SendLinkService {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly getPatient = new GetPatientSnapshotRepository(),
    private readonly sendLink = new SendLinkAction(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    sendLinkSchema: AnamnesisSendLinkSchema,
  ): Promise<AnamnesisSendLinkResult> {
    const recordId = await this.getRecordId.execute(ctx, patientId);
    if (!recordId) throw new MedicalRecordNotFoundError();
    const patient = await this.getPatient.execute(ctx, patientId);
    if (!patient) throw new PatientNotFoundForRecordError();
    return this.sendLink.execute(ctx, patient, sendLinkSchema);
  }
}
