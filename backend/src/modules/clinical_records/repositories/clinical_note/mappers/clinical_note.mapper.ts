import type {
  ClinicalNoteProcedure,
  ClinicalNoteSignature,
  ClinicalNoteSummary,
} from '../../../types/clinical_note/clinical_note_list.types.js';

export function formatContentHash(hex: string): string {
  return hex.startsWith('sha256:') ? hex : `sha256:${hex}`;
}

export function parseProcedures(value: unknown): ClinicalNoteProcedure[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      procedureId: typeof item.procedureId === 'string' ? item.procedureId : '',
      toothCode: typeof item.toothCode === 'string' ? item.toothCode : null,
      face: typeof item.face === 'string' ? item.face : null,
    }))
    .filter((item) => item.procedureId);
}

export function parseSignature(value: unknown): ClinicalNoteSignature {
  const rec = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    type: typeof rec.type === 'string' ? rec.type : 'SIMPLE',
    userId: typeof rec.userId === 'string' ? rec.userId : '',
    croNumber: typeof rec.croNumber === 'string' ? rec.croNumber : '',
    croState: typeof rec.croState === 'string' ? rec.croState : null,
    ip: typeof rec.ip === 'string' ? rec.ip : undefined,
  };
}

export function mapClinicalNote(row: {
  id: string;
  appointmentId: string | null;
  professionalId: string;
  content: string;
  procedures: unknown;
  version: number;
  supersedesId: string | null;
  amendReason: string | null;
  contentHash: string;
  signedAt: Date;
  signature: unknown;
  createdAt: Date;
}): ClinicalNoteSummary {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    professionalId: row.professionalId,
    content: row.content,
    procedures: parseProcedures(row.procedures),
    version: row.version,
    supersedesId: row.supersedesId,
    amendReason: row.amendReason,
    contentHash: formatContentHash(row.contentHash),
    signedAt: row.signedAt.toISOString(),
    signature: parseSignature(row.signature),
    createdAt: row.createdAt.toISOString(),
  };
}
