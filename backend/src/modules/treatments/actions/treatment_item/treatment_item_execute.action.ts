import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { createProductionEntry } from '../../../billing/billing_public.js';
import {
  applyExecutionToothState,
  createSignedNote,
} from '../../../clinical_records/clinical_records_public.js';
import { getProfessionalByMembershipId } from '../../../clinic/clinic_public.js';
import { getPatientById } from '../../../patients/patients_public.js';
import { getAppointmentById, startAppointment } from '../../../scheduling/scheduling_public.js';
import { defaultToothCondition } from '../../helpers/execution_tooth.helper.js';
import { nextPlanStatus } from '../../models/treatment_plan.model.js';
import {
  ExecuteBatchMismatchError,
  ExecuteCroRequiredError,
  ItemAlreadyExecutedError,
  ItemNotExecutableError,
  PatientRequiredError,
  ToothStateRequiredError,
  TreatmentItemNotFoundError,
} from '../../models/errors/treatments.errors.js';
import { ListByIdsRepository } from '../../repositories/treatment_item/treatment_item_list_by_ids.repository.js';
import { ListByPlanRepository } from '../../repositories/treatment_item/treatment_item_list_by_plan.repository.js';
import { MarkExecutedRepository } from '../../repositories/treatment_item/treatment_item_mark_executed.repository.js';
import type { TreatmentItemRow } from '../../repositories/treatment_item/treatment_item_get.repository.js';
import { UpdateStatusRepository } from '../../repositories/treatment_plan/treatment_plan_update_status.repository.js';
import type {
  TreatmentItemBatchExecuteInput,
  TreatmentItemExecuteResult,
} from '../../types/treatment_item/treatment_item_execute.types.js';

const LINKABLE_WITHOUT_START = new Set(['IN_SERVICE', 'COMPLETED']);
const STARTABLE = new Set(['SCHEDULED', 'CONFIRMED']);

export class ExecuteAction {
  constructor(
    private readonly listByIds = new ListByIdsRepository(),
    private readonly listByPlan = new ListByPlanRepository(),
    private readonly markExecuted = new MarkExecutedRepository(),
    private readonly updatePlan = new UpdateStatusRepository(),
    private readonly uow = new UnitOfWork(),
  ) {}

  async execute(
    ctx: RequestContext,
    executeSchema: TreatmentItemBatchExecuteInput,
  ): Promise<TreatmentItemExecuteResult> {
    const uniqueIds = [...new Set(executeSchema.itemIds)];
    const items = await this.listByIds.execute(ctx, uniqueIds);
    if (items.length !== uniqueIds.length) throw new TreatmentItemNotFoundError();

    const planId = items[0]?.treatmentPlanId;
    const patientId = items[0]?.patientId;
    if (!planId || !patientId) throw new TreatmentItemNotFoundError();
    if (items.some((item) => item.treatmentPlanId !== planId || item.patientId !== patientId)) {
      throw new ExecuteBatchMismatchError();
    }

    for (const item of items) {
      if (item.status === 'EXECUTED') throw new ItemAlreadyExecutedError();
      if (item.status !== 'PLANNED' && item.status !== 'SCHEDULED') {
        throw new ItemNotExecutableError(item.status);
      }
    }

    if (!ctx.membershipId) throw new ExecuteCroRequiredError();
    const professional = await getProfessionalByMembershipId(ctx, ctx.membershipId);
    if (!professional?.croNumber?.trim()) throw new ExecuteCroRequiredError();

    const patient = await getPatientById(ctx, patientId);
    if (!patient) throw new PatientRequiredError();
    const unitId = items[0]?.unitId ?? patient.unitId;
    if (!unitId) throw new PatientRequiredError();

    if (executeSchema.appointmentId) {
      await linkAppointment(ctx, patientId, executeSchema.appointmentId);
    }

    const resolved = items.map((item) => resolveTooth(item, executeSchema.toothStates?.[item.id]));

    return this.uow.run(ctx, async ({ tx, publish }) => {
      const note = await createSignedNote(
        ctx,
        {
          patientId,
          content: executeSchema.note,
          appointmentId: executeSchema.appointmentId ?? null,
          professional: {
            id: professional.id,
            userId: professional.userId,
            croNumber: professional.croNumber,
            croState: professional.croState,
          },
          procedures: items.map((item) => ({
            procedureId: item.procedureId,
            toothCode: item.toothCode,
            face: item.face,
          })),
        },
        tx,
      );

      const produced: TreatmentItemExecuteResult['items'] = [];
      const now = new Date();
      for (const item of resolved) {
        if (item.toothCode && item.condition) {
          await applyExecutionToothState(
            ctx,
            {
              patientId,
              toothCode: item.toothCode,
              condition: item.condition,
              face: item.face,
              justification: item.justification,
              sourceId: item.id,
            },
            tx,
          );
        }
        await this.markExecuted.executeInTx(tx, ctx, item.id, {
          clinicalNoteId: note.id,
          professionalId: note.professionalId,
        });
        const production = await createProductionEntry(
          ctx,
          {
            unitId,
            professionalId: note.professionalId,
            patientId,
            procedureId: item.procedureId,
            amountCents: BigInt(item.priceCents),
            executedAt: now,
            treatmentItemId: item.id,
          },
          tx,
        );
        produced.push({ id: item.id, status: 'EXECUTED', productionEntryId: production.id });
      }

      const allItems = await this.listByPlan.executeInTx(tx, planId);
      const planStatus = nextPlanStatus(allItems);
      if (planStatus !== 'ACTIVE') {
        await this.updatePlan.executeInTx(tx, ctx, planId, planStatus);
      }

      publish([
        {
          name: 'treatments.item_executed',
          payload: {
            planId,
            itemIds: produced.map((row) => row.id),
            noteId: note.id,
            patientId,
            requestId: ctx.requestId,
          },
        },
        ...(planStatus === 'COMPLETED'
          ? [
              {
                name: 'treatments.plan_completed',
                payload: { planId, patientId, requestId: ctx.requestId },
              },
            ]
          : []),
      ]);

      return { noteId: note.id, planId, planStatus, items: produced };
    });
  }
}

function resolveTooth(
  item: TreatmentItemRow,
  override?: { toothState: string; justification?: string | null },
): TreatmentItemRow & { condition: string | null; justification: string | null } {
  if (!item.toothCode) {
    return { ...item, condition: null, justification: null };
  }
  const mapped = defaultToothCondition(item.procedureCode);
  const condition = override?.toothState ?? mapped;
  if (!condition) throw new ToothStateRequiredError();
  return {
    ...item,
    condition,
    justification: override?.justification ?? null,
  };
}

async function linkAppointment(
  ctx: RequestContext,
  patientId: string,
  appointmentId: string,
): Promise<void> {
  const appointment = await getAppointmentById(ctx, appointmentId);
  if (!appointment || appointment.patientId !== patientId) {
    throw new ExecuteBatchMismatchError();
  }
  if (LINKABLE_WITHOUT_START.has(appointment.status)) return;
  if (STARTABLE.has(appointment.status)) {
    await startAppointment(ctx, appointmentId);
    return;
  }
  throw new ExecuteBatchMismatchError();
}
