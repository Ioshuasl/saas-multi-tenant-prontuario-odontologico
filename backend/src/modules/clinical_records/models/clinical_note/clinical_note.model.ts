import type { ClinicalNoteProcedure } from '../../types/clinical_note/clinical_note_list.types.js';
import {
  AmendReasonRequiredError,
  ClinicalNoteTooShortError,
  ProfessionalWithoutCroError,
} from '../errors/clinical_records.errors.js';

export type NoteProfessional = {
  id: string;
  userId: string;
  croNumber: string | null;
  croState: string | null;
};

export type ClinicalNoteProps = {
  id: string;
  medicalRecordId: string;
  appointmentId: string | null;
  professionalId: string;
  content: string;
  procedures: ClinicalNoteProcedure[];
  version: number;
  supersedesId: string | null;
  amendReason: string | null;
  signedAt: Date;
  signature: {
    type: 'SIMPLE';
    userId: string;
    croNumber: string;
    croState: string | null;
    ip?: string;
  };
};

export class ClinicalNote {
  private constructor(readonly props: ClinicalNoteProps) {}

  get id() {
    return this.props.id;
  }
  get content() {
    return this.props.content;
  }
  get procedures() {
    return this.props.procedures;
  }
  get version() {
    return this.props.version;
  }

  static fromPersisted(props: ClinicalNoteProps): ClinicalNote {
    return new ClinicalNote(props);
  }

  static create(input: {
    id: string;
    medicalRecordId: string;
    appointmentId: string | null;
    professional: NoteProfessional;
    content: string;
    procedures?: ClinicalNoteProcedure[];
    now?: Date;
    ip?: string;
  }): ClinicalNote {
    const content = input.content.trim();
    if (content.length < 10) throw new ClinicalNoteTooShortError();
    if (!input.professional.croNumber?.trim()) throw new ProfessionalWithoutCroError();

    const now = input.now ?? new Date();
    return new ClinicalNote({
      id: input.id,
      medicalRecordId: input.medicalRecordId,
      appointmentId: input.appointmentId,
      professionalId: input.professional.id,
      content,
      procedures: input.procedures ?? [],
      version: 1,
      supersedesId: null,
      amendReason: null,
      signedAt: now,
      signature: {
        type: 'SIMPLE',
        userId: input.professional.userId,
        croNumber: input.professional.croNumber.trim(),
        croState: input.professional.croState,
        ...(input.ip ? { ip: input.ip } : {}),
      },
    });
  }

  amend(input: {
    id: string;
    reason: string;
    content: string;
    professional: NoteProfessional;
    now?: Date;
    ip?: string;
  }): ClinicalNote {
    const reason = input.reason.trim();
    if (reason.length < 10) throw new AmendReasonRequiredError();
    const content = input.content.trim();
    if (content.length < 10) throw new ClinicalNoteTooShortError();
    if (!input.professional.croNumber?.trim()) throw new ProfessionalWithoutCroError();

    const now = input.now ?? new Date();
    return new ClinicalNote({
      id: input.id,
      medicalRecordId: this.props.medicalRecordId,
      appointmentId: this.props.appointmentId,
      professionalId: input.professional.id,
      content,
      procedures: this.props.procedures,
      version: this.props.version + 1,
      supersedesId: this.props.id,
      amendReason: reason,
      signedAt: now,
      signature: {
        type: 'SIMPLE',
        userId: input.professional.userId,
        croNumber: input.professional.croNumber.trim(),
        croState: input.professional.croState,
        ...(input.ip ? { ip: input.ip } : {}),
      },
    });
  }
}

export function canonicalNotePayload(content: string, procedures: ClinicalNoteProcedure[]): string {
  return JSON.stringify({
    content: content.trim(),
    procedures: procedures.map((p) => ({
      procedureId: p.procedureId,
      toothCode: p.toothCode ?? null,
      face: p.face ?? null,
    })),
  });
}
