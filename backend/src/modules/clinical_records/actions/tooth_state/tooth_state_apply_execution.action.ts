import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { appendOutboxEvents } from '../../../../shared/database/outbox.js';
import {
  InvalidToothCodeError,
  MedicalRecordNotFoundError,
  ToothStateConflictError,
} from '../../models/errors/clinical_records.errors.js';
import {
  hasRestorationConflict,
  isValidToothCode,
  normalizeFace,
} from '../../models/tooth_state/tooth_state.model.js';
import { TOOTH_CONDITIONS, type ToothCondition } from '../../enum/tooth_state/tooth_condition.enum.js';
import { DENTITIONS, type Dentition } from '../../enum/tooth_state/dentition.enum.js';
import type { ToothFace } from '../../enum/tooth_state/tooth_face.enum.js';
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListByToothRepository } from '../../repositories/tooth_state/tooth_state_list_by_tooth.repository.js';
import { UpsertRepository } from '../../repositories/tooth_state/tooth_state_upsert.repository.js';
import { CreateRepository as CreateHistoryRepository } from '../../repositories/tooth_state_history/tooth_state_history_create.repository.js';
import type { ApplyExecutionToothStateInput } from '../../types/clinical_note/clinical_note_signed.types.js';

function isCondition(value: string): value is ToothCondition {
  return (TOOTH_CONDITIONS as readonly string[]).includes(value);
}

function inferDentition(toothCode: string, explicit?: Dentition): Dentition {
  if (explicit) return explicit;
  if (isValidToothCode('PERMANENT', toothCode)) return 'PERMANENT';
  return 'DECIDUOUS';
}

export class ApplyExecutionAction {
  constructor(
    private readonly getRecordId = new GetIdRepository(),
    private readonly listByTooth = new ListByToothRepository(),
    private readonly upsert = new UpsertRepository(),
    private readonly createHistory = new CreateHistoryRepository(),
  ) {}

  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    toothSchema: ApplyExecutionToothStateInput,
  ): Promise<void> {
    if (!isCondition(toothSchema.condition)) {
      throw new InvalidToothCodeError();
    }
    const dentition = inferDentition(
      toothSchema.toothCode,
      toothSchema.dentition && (DENTITIONS as readonly string[]).includes(toothSchema.dentition)
        ? toothSchema.dentition
        : undefined,
    );
    if (!isValidToothCode(dentition, toothSchema.toothCode)) {
      throw new InvalidToothCodeError();
    }

    const medicalRecordId = await this.getRecordId.executeInTx(tx, ctx, toothSchema.patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const face = normalizeFace((toothSchema.face ?? null) as ToothFace | null);
    const justification = toothSchema.justification?.trim() ?? null;

    const siblings = await this.listByTooth.executeInTx(tx, ctx, {
      medicalRecordId,
      dentition,
      toothCode: toothSchema.toothCode,
    });
    const existing = siblings.find((row) => row.face === face) ?? null;
    const conditions = siblings.map((row) => row.condition);
    if (hasRestorationConflict(conditions, toothSchema.condition) && !justification) {
      throw new ToothStateConflictError();
    }

    if (
      existing &&
      existing.condition === toothSchema.condition &&
      (existing.notes ?? null) === null
    ) {
      return;
    }

    const upserted = await this.upsert.executeInTx(
      tx,
      ctx,
      {
        medicalRecordId,
        dentition,
        toothCode: toothSchema.toothCode,
        face,
        condition: toothSchema.condition,
        notes: null,
        recordedBy: ctx.userId,
      },
      existing?.id ?? null,
    );

    await this.createHistory.executeInTx(tx, ctx, {
      toothStateId: upserted.id,
      fromCondition: existing?.condition ?? null,
      toCondition: toothSchema.condition,
      source: 'PROCEDURE_EXECUTION',
      sourceId: toothSchema.sourceId ?? null,
      actorId: ctx.userId,
      createdAt: new Date(upserted.result.recordedAt),
    });

    await appendOutboxEvents(tx, ctx.tenantId, [
      {
        name: 'clinical_records.odontogram_updated',
        payload: {
          patientId: toothSchema.patientId,
          medicalRecordId,
          toothStateId: upserted.id,
          toothCode: toothSchema.toothCode,
          requestId: ctx.requestId,
        },
      },
    ]);
  }
}
