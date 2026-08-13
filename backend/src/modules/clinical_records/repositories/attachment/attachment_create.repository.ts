import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import type { Attachment } from '../../models/attachment/attachment.model.js';

export class CreateRepository {
  async executeInTx(tx: DbTransaction, ctx: RequestContext, attachment: Attachment): Promise<void> {
    await tx.attachment.create({
      data: {
        id: attachment.props.id,
        tenantId: ctx.tenantId,
        medicalRecordId: attachment.props.medicalRecordId,
        patientId: attachment.props.patientId,
        clinicalNoteId: attachment.props.clinicalNoteId,
        category: attachment.props.category,
        fileName: attachment.props.fileName,
        storageKey: attachment.props.storageKey,
        mimeType: attachment.props.mimeType,
        sizeBytes: BigInt(attachment.props.sizeBytes),
        checksumSha256: attachment.props.checksumSha256,
        uploadedBy: attachment.props.uploadedBy,
      },
    });
  }
}
