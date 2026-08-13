export const TOOTH_STATE_HISTORY_SOURCES = ['MANUAL', 'PROCEDURE_EXECUTION'] as const;

export type ToothStateHistorySource = (typeof TOOTH_STATE_HISTORY_SOURCES)[number];
