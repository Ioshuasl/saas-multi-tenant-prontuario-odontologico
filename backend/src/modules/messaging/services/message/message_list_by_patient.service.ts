import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getPatientById } from '../../../patients/patients_public.js';
import { InboxPatientNotFoundError } from '../../models/errors/messaging.errors.js';
import { ListByPatientRepository } from '../../repositories/message/message_list_by_patient.repository.js';
import type { PatientMessageListQuerySchema } from '../../schemas/conversation.schema.js';
import type { MessageListResult } from '../../types/message/message.types.js';

export class ListByPatientService {
  constructor(private readonly list = new ListByPatientRepository()) {}

  async execute(
    ctx: RequestContext,
    patientMessageSchema: PatientMessageListQuerySchema,
  ): Promise<MessageListResult> {
    const patient = await getPatientById(ctx, patientMessageSchema.patientId);
    if (!patient) throw new InboxPatientNotFoundError();
    return this.list.execute(ctx, patientMessageSchema.patientId, {
      cursor: patientMessageSchema.cursor,
      limit: patientMessageSchema.limit,
    });
  }
}
