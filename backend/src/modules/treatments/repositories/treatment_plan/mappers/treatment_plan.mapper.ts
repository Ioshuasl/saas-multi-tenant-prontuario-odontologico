import type { TreatmentItemStatus } from '../../../enum/treatment_item/treatment_item_status.enum.js';
import type { TreatmentPlanStatus } from '../../../enum/treatment_plan/treatment_plan_status.enum.js';
import { planProgress } from '../../../models/treatment_plan.model.js';
import type {
  TreatmentPlanDto,
  TreatmentPlanItemDto,
  TreatmentPlanListItemDto,
} from '../../../types/treatment_plan/treatment_plan_get.types.js';

type ItemRow = {
  id: string;
  procedureId: string;
  toothCode: string | null;
  face: string | null;
  priceCents: bigint;
  status: string;
  professionalId: string | null;
  executedAt: Date | null;
  clinicalNoteId: string | null;
  procedure: { code: string; name: string };
};

type PlanRow = {
  id: string;
  patientId: string;
  quoteId: string | null;
  status: string;
  startedAt: Date;
  completedAt: Date | null;
  items: ItemRow[];
};

export function toPlanItemDto(row: ItemRow): TreatmentPlanItemDto {
  return {
    id: row.id,
    procedureId: row.procedureId,
    procedureCode: row.procedure.code,
    procedureName: row.procedure.name,
    toothCode: row.toothCode,
    face: row.face,
    priceCents: Number(row.priceCents),
    status: row.status as TreatmentItemStatus,
    professionalId: row.professionalId,
    executedAt: row.executedAt?.toISOString() ?? null,
    clinicalNoteId: row.clinicalNoteId,
  };
}

export function toPlanDto(row: PlanRow): TreatmentPlanDto {
  const items = row.items.map(toPlanItemDto);
  const progress = planProgress(items);
  return {
    id: row.id,
    patientId: row.patientId,
    quoteId: row.quoteId,
    status: row.status as TreatmentPlanStatus,
    ...progress,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    items,
  };
}

export function toPlanListItemDto(row: PlanRow): TreatmentPlanListItemDto {
  const { items: _items, ...rest } = toPlanDto(row);
  void _items;
  return { ...rest, itemCount: row.items.length };
}
