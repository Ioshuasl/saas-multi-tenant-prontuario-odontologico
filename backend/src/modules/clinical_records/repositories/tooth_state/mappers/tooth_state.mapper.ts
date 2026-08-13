import type {
  OdontogramHistoryItem,
  OdontogramTooth,
} from '../../../types/odontogram/odontogram_get.types.js';
import type { OdontogramToothUpdateResult } from '../../../types/odontogram/odontogram_update.types.js';

export type ToothStateRow = {
  id: string;
  dentition: string;
  toothCode: string;
  face: string | null;
  condition: string;
  notes: string | null;
  recordedBy: string;
  recordedAt: Date;
  history?: Array<{
    fromCondition: string | null;
    toCondition: string;
    source: string;
    actorId: string;
    createdAt: Date;
  }>;
};

export function mapTooth(row: ToothStateRow, includeHistory: boolean): OdontogramTooth {
  const tooth: OdontogramTooth = {
    toothCode: row.toothCode,
    face: row.face,
    condition: row.condition,
    notes: row.notes,
    recordedAt: row.recordedAt.toISOString(),
    recordedBy: row.recordedBy,
  };
  if (includeHistory) {
    tooth.history = (row.history ?? []).map(
      (h): OdontogramHistoryItem => ({
        at: h.createdAt.toISOString(),
        fromCondition: h.fromCondition,
        toCondition: h.toCondition,
        source: h.source,
      }),
    );
  }
  return tooth;
}

export function mapUpdateResult(row: ToothStateRow): OdontogramToothUpdateResult {
  return {
    toothCode: row.toothCode,
    face: row.face,
    dentition: row.dentition,
    condition: row.condition,
    notes: row.notes,
    recordedAt: row.recordedAt.toISOString(),
    recordedBy: row.recordedBy,
  };
}

export function reconstructAt(rows: ToothStateRow[], at: Date): OdontogramTooth[] {
  const teeth: OdontogramTooth[] = [];
  for (const row of rows) {
    const events = [...(row.history ?? [])]
      .filter((h) => h.createdAt.getTime() <= at.getTime())
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    if (events.length === 0) continue;
    const last = events[events.length - 1]!;
    teeth.push({
      toothCode: row.toothCode,
      face: row.face,
      condition: last.toCondition,
      notes: null,
      recordedAt: last.createdAt.toISOString(),
      recordedBy: last.actorId,
    });
  }
  return teeth;
}
