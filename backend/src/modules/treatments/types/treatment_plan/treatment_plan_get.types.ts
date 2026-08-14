import type { TreatmentItemStatus } from '../../enum/treatment_item/treatment_item_status.enum.js';
import type { TreatmentPlanStatus } from '../../enum/treatment_plan/treatment_plan_status.enum.js';

export type TreatmentPlanItemDto = {
  id: string;
  procedureId: string;
  procedureCode: string;
  procedureName: string;
  toothCode: string | null;
  face: string | null;
  priceCents: number;
  status: TreatmentItemStatus;
  professionalId: string | null;
  executedAt: string | null;
  clinicalNoteId: string | null;
};

export type TreatmentPlanDto = {
  id: string;
  patientId: string;
  quoteId: string | null;
  status: TreatmentPlanStatus;
  progressPercent: number;
  executedCents: number;
  pendingCents: number;
  startedAt: string;
  completedAt: string | null;
  items: TreatmentPlanItemDto[];
};

export type TreatmentPlanListItemDto = Omit<TreatmentPlanDto, 'items'> & { itemCount: number };

export type TreatmentPlanListResult = {
  items: TreatmentPlanListItemDto[];
  nextCursor: string | null;
};

export type TreatmentPlanSummary = {
  id: string;
  patientId: string;
  quoteId: string | null;
  status: TreatmentPlanStatus;
  items: Array<{
    id: string;
    procedureId: string;
    toothCode: string | null;
    face: string | null;
    priceCents: number;
    status: TreatmentItemStatus;
  }>;
};
