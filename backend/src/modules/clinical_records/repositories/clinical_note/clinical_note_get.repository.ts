import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { ClinicalNoteSummary } from '../../types/clinical_note/clinical_note_list.types.js';
import { mapClinicalNote } from './mappers/clinical_note.mapper.js';

export type ClinicalNoteGetResult = ClinicalNoteSummary & { medicalRecordId: string };

export class GetRepository {
  async execute(
    ctx: RequestContext,
    medicalRecordId: string,
    noteId: string,
  ): Promise<ClinicalNoteGetResult | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.clinicalNote.findFirst({
        where: { id: noteId, tenantId: ctx.tenantId, medicalRecordId },
      });
      if (!row) return null;

      const dek = await unwrapActiveDek(tx, ctx.tenantId);
      const content = decryptField(row.content, dek, {
        tenantId: ctx.tenantId,
        table: 'clinical_note',
        column: 'content',
        rowId: row.id,
      });
      return {
        ...mapClinicalNote({ ...row, content }),
        medicalRecordId: row.medicalRecordId,
      };
    });
  }
}
