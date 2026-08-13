import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { decryptField } from '../../../../shared/crypto/envelope.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { unwrapActiveDek } from '../../../../shared/database/tenant_dek.js';
import type { ClinicalNoteListResult } from '../../types/clinical_note/clinical_note_list.types.js';
import { mapClinicalNote } from './mappers/clinical_note.mapper.js';

export class ListRepository {
  async execute(
    ctx: RequestContext,
    medicalRecordId: string,
    query: { cursor?: string; limit: number },
  ): Promise<ClinicalNoteListResult> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const cursorRow = query.cursor
        ? await tx.clinicalNote.findFirst({
            where: { id: query.cursor, tenantId: ctx.tenantId, medicalRecordId },
            select: { id: true, createdAt: true },
          })
        : null;

      const rows = await tx.clinicalNote.findMany({
        where: {
          tenantId: ctx.tenantId,
          medicalRecordId,
          ...(cursorRow
            ? {
                OR: [
                  { createdAt: { lt: cursorRow.createdAt } },
                  { createdAt: cursorRow.createdAt, id: { lt: cursorRow.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: query.limit + 1,
      });

      const dek = rows.length > 0 ? await unwrapActiveDek(tx, ctx.tenantId) : null;
      const page = rows.slice(0, query.limit);
      const items = page.map((row) => {
        const content = dek
          ? decryptField(row.content, dek, {
              tenantId: ctx.tenantId,
              table: 'clinical_note',
              column: 'content',
              rowId: row.id,
            })
          : row.content;
        return mapClinicalNote({ ...row, content });
      });

      return {
        items,
        nextCursor: rows.length > query.limit ? (page[page.length - 1]?.id ?? null) : null,
      };
    });
  }
}
