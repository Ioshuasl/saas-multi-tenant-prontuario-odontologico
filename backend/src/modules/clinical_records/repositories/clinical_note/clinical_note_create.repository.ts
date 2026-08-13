import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { encryptField } from '../../../../shared/crypto/envelope.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { ClinicalNote } from '../../models/clinical_note/clinical_note.model.js';

export class CreateRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    note: ClinicalNote,
    contentHash: string,
  ): Promise<void> {
    const dek = await unwrapActiveDek(tx, ctx.tenantId);
    const ciphertext = encryptField(note.content, dek, {
      tenantId: ctx.tenantId,
      table: 'clinical_note',
      column: 'content',
      rowId: note.id,
    });

    await tx.clinicalNote.create({
      data: {
        id: note.id,
        tenantId: ctx.tenantId,
        medicalRecordId: note.props.medicalRecordId,
        appointmentId: note.props.appointmentId,
        professionalId: note.props.professionalId,
        content: ciphertext,
        procedures: note.procedures,
        version: note.version,
        supersedesId: note.props.supersedesId,
        amendReason: note.props.amendReason,
        contentHash,
        signedAt: note.props.signedAt,
        signature: note.props.signature,
      },
    });
  }
}
