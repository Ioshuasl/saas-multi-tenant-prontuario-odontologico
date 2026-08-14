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
  toothStates?: Record<string, { toothState: string; justification?: string | null }>;
};

export type TreatmentItemExecuteResult = {
  noteId: string;
  planId: string;
  planStatus: string;
  items: Array<{ id: string; status: string; productionEntryId: string }>;
};

export type TreatmentItemCancelInput = {
  reason: string;
};

export type TreatmentItemCancelResult = {
  id: string;
  status: string;
  planId: string;
  planStatus: string;
};
