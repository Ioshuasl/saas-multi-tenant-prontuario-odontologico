import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { ensureRecord } from '../clinical_records_public.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/** Consumer `patients.patient_created` — idempotente por unique (tenant, patient). */
export async function ensureMedicalRecordJob(payload: JobPayload): Promise<void> {
  const patientId = typeof payload.patientId === 'string' ? payload.patientId : '';
  if (!patientId) return;

  await ensureRecord(
    {
      tenantId: payload.tenantId,
      userId: SYSTEM_USER_ID,
      requestId: payload.requestId,
    },
    patientId,
  );
}
