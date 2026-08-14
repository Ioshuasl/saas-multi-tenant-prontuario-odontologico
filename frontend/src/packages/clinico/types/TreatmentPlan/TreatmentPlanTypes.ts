import type { TreatmentItemStatus } from '@/packages/clinico/enum/TreatmentPlan/TreatmentItemStatusEnum';
import type { TreatmentPlanStatus } from '@/packages/clinico/enum/TreatmentPlan/TreatmentPlanStatusEnum';

export type TreatmentPlanItem = {
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

export type TreatmentPlanDetail = {
  id: string;
  patientId: string;
  quoteId: string | null;
  status: TreatmentPlanStatus;
  progressPercent: number;
  executedCents: number;
  pendingCents: number;
  startedAt: string;
  completedAt: string | null;
  items: TreatmentPlanItem[];
};

export type TreatmentPlanListItem = Omit<TreatmentPlanDetail, 'items'> & { itemCount: number };

export type TreatmentPlanListQuery = {
  patientId?: string;
  status?: TreatmentPlanStatus;
  cursor?: string;
  limit?: number;
};

export type TreatmentPlanListResult = {
  items: TreatmentPlanListItem[];
  nextCursor: string | null;
};

export type TreatmentItemExecuteInput = {
  appointmentId?: string | null;
  note: string;
  toothState?: string;
  justification?: string | null;
};

export type TreatmentItemBatchExecuteInput = {
  itemIds: string[];
  note: string;
  appointmentId?: string | null;
};

export type TreatmentItemExecuteResult = {
  noteId: string;
  planId: string;
  planStatus: string;
  items: Array<{ id: string; status: string; productionEntryId: string }>;
};
