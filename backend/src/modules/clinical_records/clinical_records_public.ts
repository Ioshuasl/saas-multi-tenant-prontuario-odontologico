import type { RequestContext } from '../../shared/domain/request_context.js';
import type { DbTransaction } from '../../shared/database/db_transaction.js';
import { ListCriticalRepository } from './repositories/clinical_alert/clinical_alert_list_critical.repository.js';
import { EnsureRepository } from './repositories/medical_record/medical_record_ensure.repository.js';
import { SeedRepository } from './repositories/anamnesis_form/anamnesis_form_seed.repository.js';
import { PersistAction } from './actions/clinical_note/clinical_note_persist.action.js';
import { ApplyExecutionAction } from './actions/tooth_state/tooth_state_apply_execution.action.js';
import { SoftDeleteNonClinicalRepository } from './repositories/attachment/attachment_soft_delete_non_clinical.repository.js';
import type { ClinicalAlertSummary } from './types/medical_record/medical_record_get.types.js';
import type { EnsureRecordResult } from './repositories/medical_record/medical_record_ensure.repository.js';
import type {
  ApplyExecutionToothStateInput,
  CreateSignedNoteInput,
  CreateSignedNoteResult,
} from './types/clinical_note/clinical_note_signed.types.js';

const ensure = new EnsureRepository();
const listCritical = new ListCriticalRepository();
const seedForm = new SeedRepository();
const persistNote = new PersistAction();
const applyTooth = new ApplyExecutionAction();
const softDeleteNonClinical = new SoftDeleteNonClinicalRepository();

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

/** Evolução assinada na mesma TX do caller (ExecuteItem). */
export async function createSignedNote(
  ctx: RequestContext,
  noteSchema: CreateSignedNoteInput,
  tx: DbTransaction,
): Promise<CreateSignedNoteResult> {
  return persistNote.executeInTx(tx, ctx, noteSchema);
}

/** Odontograma com source=PROCEDURE_EXECUTION na mesma TX do caller. */
export async function applyExecutionToothState(
  ctx: RequestContext,
  toothSchema: ApplyExecutionToothStateInput,
  tx: DbTransaction,
): Promise<void> {
  await applyTooth.executeInTx(tx, ctx, toothSchema);
}

/** Remove anexos não clínicos (DOCUMENT/CONSENT_FORM/OTHER). Mantém RX/foto/exame. */
export async function softDeleteNonClinicalAttachments(
  ctx: RequestContext,
  patientId: string,
  tx?: DbTransaction,
): Promise<number> {
  if (tx) return softDeleteNonClinical.executeInTx(tx, ctx, patientId);
  return softDeleteNonClinical.execute(ctx, patientId);
}

export type { ClinicalAlertSummary, EnsureRecordResult };
export type {
  ApplyExecutionToothStateInput,
  CreateSignedNoteInput,
  CreateSignedNoteResult,
} from './types/clinical_note/clinical_note_signed.types.js';
