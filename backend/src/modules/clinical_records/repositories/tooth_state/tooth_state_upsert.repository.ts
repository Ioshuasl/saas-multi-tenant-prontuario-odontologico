import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import type { Dentition } from '../../enum/tooth_state/dentition.enum.js';
import type { ToothCondition } from '../../enum/tooth_state/tooth_condition.enum.js';
import type { ToothFace } from '../../enum/tooth_state/tooth_face.enum.js';
import { mapUpdateResult } from './mappers/tooth_state.mapper.js';
import type { OdontogramToothUpdateResult } from '../../types/odontogram/odontogram_update.types.js';

export type UpsertToothInput = {
  medicalRecordId: string;
  dentition: Dentition;
  toothCode: string;
  face: ToothFace | null;
  condition: ToothCondition;
  notes: string | null;
  recordedBy: string;
};

export class UpsertRepository {
  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    input: UpsertToothInput,
    existingId: string | null,
  ): Promise<{ id: string; created: boolean; result: OdontogramToothUpdateResult }> {
    const now = new Date();
    if (existingId) {
      const row = await tx.toothState.update({
        where: { id: existingId },
        data: {
          condition: input.condition,
          notes: input.notes,
          recordedBy: input.recordedBy,
          recordedAt: now,
        },
      });
      return {
        id: row.id,
        created: false,
        result: mapUpdateResult({
          id: row.id,
          dentition: row.dentition,
          toothCode: row.toothCode,
          face: row.face,
          condition: row.condition,
          notes: row.notes,
          recordedBy: row.recordedBy,
          recordedAt: row.recordedAt,
        }),
      };
    }

    const id = idGenerator.next();
    const row = await tx.toothState.create({
      data: {
        id,
        tenantId: ctx.tenantId,
        medicalRecordId: input.medicalRecordId,
        dentition: input.dentition,
        toothCode: input.toothCode,
        face: input.face,
        condition: input.condition,
        notes: input.notes,
        recordedBy: input.recordedBy,
        recordedAt: now,
      },
    });
    return {
      id: row.id,
      created: true,
      result: mapUpdateResult({
        id: row.id,
        dentition: row.dentition,
        toothCode: row.toothCode,
        face: row.face,
        condition: row.condition,
        notes: row.notes,
        recordedBy: row.recordedBy,
        recordedAt: row.recordedAt,
      }),
    };
  }
}
