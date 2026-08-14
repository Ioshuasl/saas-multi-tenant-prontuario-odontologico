import type { PatientAddress } from '../types/patients.types.js';
import { formatDateOnly } from '../helpers/patient.helper.js';
import type {
  ConsentSummary,
  LegalGuardianSummary,
  PatientDetail,
  PatientSummary,
  PatientWarning,
} from '../types/patients.types.js';

type PatientRow = {
  id: string;
  unitId: string;
  code: bigint | number;
  name: string;
  socialName: string | null;
  cpf: string | null;
  birthDate: Date | null;
  sex: string | null;
  phonePrimary: string;
  phoneSecondary: string | null;
  email: string | null;
  address: unknown;
  howFoundUs: string | null;
  notes: string | null;
  origin?: string;
  active: boolean;
  hasOverdue?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type GuardianRow = {
  id: string;
  patientId: string;
  name: string;
  cpf: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
};

type ConsentRow = {
  id: string;
  patientId: string;
  type: string;
  granted: boolean;
  documentVersion: string;
  channel: string;
  grantedAt: Date;
  revokedAt: Date | null;
};

export function mapPatientSummary(row: PatientRow): PatientSummary {
  return {
    id: row.id,
    unitId: row.unitId,
    code: Number(row.code),
    name: row.name,
    socialName: row.socialName,
    cpf: row.cpf,
    birthDate: formatDateOnly(row.birthDate),
    sex: row.sex,
    phonePrimary: row.phonePrimary,
    phoneSecondary: row.phoneSecondary,
    email: row.email,
    address: (row.address as PatientAddress | null) ?? null,
    howFoundUs: row.howFoundUs,
    notes: row.notes,
    origin: row.origin ?? 'INTERNAL',
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    ...(row.hasOverdue === undefined ? {} : { hasOverdue: row.hasOverdue }),
  };
}

export function mapGuardian(row: GuardianRow): LegalGuardianSummary {
  return {
    id: row.id,
    patientId: row.patientId,
    name: row.name,
    cpf: row.cpf,
    relationship: row.relationship,
    phone: row.phone,
    email: row.email,
  };
}

export function mapConsent(row: ConsentRow): ConsentSummary {
  return {
    id: row.id,
    patientId: row.patientId,
    type: row.type,
    granted: row.granted,
    documentVersion: row.documentVersion,
    channel: row.channel,
    grantedAt: row.grantedAt.toISOString(),
    revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
  };
}

export function mapPatientDetail(
  row: PatientRow,
  guardians: GuardianRow[],
  consents: ConsentRow[],
  warnings: PatientWarning[],
): PatientDetail {
  return {
    ...mapPatientSummary(row),
    guardians: guardians.map(mapGuardian),
    consents: consents.map(mapConsent),
    warnings,
  };
}
