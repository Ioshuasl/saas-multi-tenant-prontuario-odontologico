import type { RequestContext } from '../../shared/domain/request_context.js';
import type { DbTransaction } from '../../shared/database/db_transaction.js';
import { ListCriticalRepository } from './repositories/clinical_alert/clinical_alert_list_critical.repository.js';
import { EnsureRepository } from './repositories/medical_record/medical_record_ensure.repository.js';
import { SeedRepository } from './repositories/anamnesis_form/anamnesis_form_seed.repository.js';
import type { ClinicalAlertSummary } from './types/medical_record/medical_record_get.types.js';
import type { EnsureRecordResult } from './repositories/medical_record/medical_record_ensure.repository.js';

const ensure = new EnsureRepository();
const listCritical = new ListCriticalRepository();
const seedForm = new SeedRepository();

/** Cria prontuário 1:1 se ainda não existir (idempotente). */
export async function ensureRecord(
  ctx: RequestContext,
  patientId: string,
  tx?: DbTransaction,
): Promise<EnsureRecordResult> {
  if (tx) return ensure.executeInTx(tx, ctx, patientId);
  return ensure.execute(ctx, patientId);
}

/**
 * Alertas CRITICAL ativos do paciente (card da agenda / outros BC).
 * Caller resolve appointment → patientId via scheduling_public.
 */
export async function getCriticalAlertsForAppointment(
  ctx: RequestContext,
  patientId: string,
): Promise<ClinicalAlertSummary[]> {
  return listCritical.execute(ctx, patientId);
}

/** Seed “Anamnese Geral” v1 no signup (idempotente). */
export async function seedDefaultAnamnesisForm(
  tx: DbTransaction,
  input: { tenantId: string; idNext: () => string },
): Promise<void> {
  await seedForm.executeInTx(tx, input);
}

export type { ClinicalAlertSummary, EnsureRecordResult };
