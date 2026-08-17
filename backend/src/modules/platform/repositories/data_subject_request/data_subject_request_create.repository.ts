import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { DsrStatus } from '../../enum/data_subject_request/data_subject_request_status.enum.js';
import type { DsrType } from '../../enum/data_subject_request/data_subject_request_type.enum.js';
import type { DataSubjectRequestRow } from '../../types/data_subject_request/data_subject_request.types.js';
import { mapDataSubjectRequest } from './mappers/data_subject_request.mapper.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: {
      patientId: string;
      type: DsrType;
      dueAt: Date;
      status: DsrStatus;
      resolution: string | null;
      completedAt: Date | null;
      handledBy: string | null;
    },
  ): Promise<DataSubjectRequestRow> {
    const row = await tx.dataSubjectRequest.create({
      data: {
        id: idGenerator.next(),
        tenantId: ctx.tenantId,
        patientId: input.patientId,
        type: input.type,
        status: input.status,
        dueAt: input.dueAt,
        resolution: input.resolution,
        completedAt: input.completedAt,
        handledBy: input.handledBy,
      },
    });
    return mapDataSubjectRequest(row);
  }
}
