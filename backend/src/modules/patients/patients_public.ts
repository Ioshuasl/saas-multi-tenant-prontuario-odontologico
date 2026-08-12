import type { RequestContext } from '../../shared/domain/request_context.js';
import { GetService } from './services/patient/patient_get.service.js';
import { ListConsentsRepository } from './repositories/patient/patient.repository.js';

const getPatient = new GetService();
const listConsents = new ListConsentsRepository();

/** Leitura de paciente para outros BCs (scheduling, messaging, …). */
export async function getPatientById(ctx: RequestContext, patientId: string) {
  return getPatient.execute(ctx, patientId);
}

/** Consentimento de marketing ativo? (messaging — RF-E3-08). */
export async function hasMarketingConsent(
  ctx: RequestContext,
  patientId: string,
): Promise<boolean> {
  const consents = await listConsents.execute(ctx, patientId);
  return consents.some(
    (c) => c.type === 'WHATSAPP_MARKETING' && c.granted && !c.revokedAt,
  );
}

export type { PatientDetail, PatientSummary } from './types/patients.types.js';
