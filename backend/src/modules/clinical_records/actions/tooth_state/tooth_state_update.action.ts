import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
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
import { GetIdRepository } from '../../repositories/medical_record/medical_record_get_id.repository.js';
import { ListByToothRepository } from '../../repositories/tooth_state/tooth_state_list_by_tooth.repository.js';
import { UpsertRepository } from '../../repositories/tooth_state/tooth_state_upsert.repository.js';
import { CreateRepository as CreateHistoryRepository } from '../../repositories/tooth_state_history/tooth_state_history_create.repository.js';
import type { OdontogramToothUpdateSchema } from '../../schemas/odontogram.schema.js';
import type { OdontogramToothUpdateResult } from '../../types/odontogram/odontogram_update.types.js';

export class UpdateAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly getRecordId = new GetIdRepository(),
    private readonly listByTooth = new ListByToothRepository(),
    private readonly upsert = new UpsertRepository(),
    private readonly createHistory = new CreateHistoryRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    toothCode: string,
    toothSchema: OdontogramToothUpdateSchema,
  ): Promise<OdontogramToothUpdateResult> {
    if (!isValidToothCode(toothSchema.dentition, toothCode)) {
      throw new InvalidToothCodeError();
    }

    const medicalRecordId = await this.getRecordId.execute(ctx, patientId);
    if (!medicalRecordId) throw new MedicalRecordNotFoundError();

    const face = normalizeFace(toothSchema.face);
    const notes = toothSchema.notes ?? null;
    const justification = toothSchema.justification?.trim() ?? null;

    return this.uow.run(ctx, async ({ tx, publish }) => {
      const siblings = await this.listByTooth.executeInTx(tx, ctx, {
        medicalRecordId,
        dentition: toothSchema.dentition,
        toothCode,
      });
      const existing = siblings.find((row) => row.face === face) ?? null;
      const conditions = siblings.map((row) => row.condition);
      if (hasRestorationConflict(conditions, toothSchema.condition) && !justification) {
        throw new ToothStateConflictError();
      }

      if (
        existing &&
        existing.condition === toothSchema.condition &&
        (existing.notes ?? null) === notes
      ) {
        return {
          toothCode,
          face,
          dentition: toothSchema.dentition,
          condition: existing.condition,
          notes: existing.notes,
          recordedAt: existing.recordedAt.toISOString(),
          recordedBy: existing.recordedBy,
        };
      }

      const upserted = await this.upsert.executeInTx(
        tx,
        ctx,
        {
          medicalRecordId,
          dentition: toothSchema.dentition,
          toothCode,
          face,
          condition: toothSchema.condition,
          notes,
          recordedBy: ctx.userId,
        },
        existing?.id ?? null,
      );

      await this.createHistory.executeInTx(tx, ctx, {
        toothStateId: upserted.id,
        fromCondition: existing?.condition ?? null,
        toCondition: toothSchema.condition,
        source: 'MANUAL',
        actorId: ctx.userId,
        createdAt: new Date(upserted.result.recordedAt),
      });

      publish([
        {
          name: 'clinical_records.odontogram_updated',
          payload: {
            patientId,
            medicalRecordId,
            toothStateId: upserted.id,
            toothCode,
            requestId: ctx.requestId,
          },
        },
      ]);

      return upserted.result;
    });
  }
}
