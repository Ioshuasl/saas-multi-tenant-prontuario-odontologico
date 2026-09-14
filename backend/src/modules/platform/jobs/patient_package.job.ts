import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { getObjectStorage, ObjectStorageError } from '../../../shared/storage/index.js';
import { getClinicLetterhead } from '../../clinic/clinic_public.js';
import { jsonFile } from '../helpers/tenant_export_csv.helper.js';
import { renderPatientPackagePdf } from '../helpers/patient_package_pdf.helper.js';
import { buildPatientPackageStorageKey } from '../helpers/patient_package_storage.helper.js';
import { buildZipStore } from '../helpers/zip_store.helper.js';
import { CollectRepository } from '../repositories/data_subject_request/data_subject_request_collect.repository.js';
import { GetRepository } from '../repositories/data_subject_request/data_subject_request_get.repository.js';
import { UpdateRepository } from '../repositories/data_subject_request/data_subject_request_update.repository.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function patientPackageJob(payload: JobPayload): Promise<void> {
  const dsrId = typeof payload.dsrId === 'string' ? payload.dsrId : '';
  if (!dsrId) return;

  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };

  const getDsr = new GetRepository();
  const collect = new CollectRepository();
  const update = new UpdateRepository();

  const dsr = await getDsr.execute(ctx, dsrId);
  if (!dsr) return;
  if (dsr.exportKey) return;
  if (dsr.type !== 'ACCESS' && dsr.type !== 'PORTABILITY') return;

  const snapshot = await collect.execute(ctx, dsr.patientId);
  if (!snapshot) return;

  const letterhead = await getClinicLetterhead(ctx, snapshot.unitId);
  const generatedAt = new Date().toISOString();
  const json = {
    kind: 'patient-package',
    generatedAt,
    dsrId,
    type: dsr.type,
    patient: snapshot.patient,
    appointments: snapshot.appointments,
    clinicalNotes: snapshot.clinicalNotes,
    anamnesisResponses: snapshot.anamnesisResponses,
    clinicalAlerts: snapshot.clinicalAlerts,
    odontogram: snapshot.odontogram,
    receivables: snapshot.receivables,
    payments: snapshot.payments,
    attachments: snapshot.attachments,
  };

  const pdf = await renderPatientPackagePdf({
    clinicName: letterhead?.name ?? 'Clínica',
    legalName: letterhead?.legalName ?? null,
    taxId: letterhead?.taxId ?? null,
    phone: letterhead?.phone ?? null,
    addressLine: letterhead?.addressLine ?? null,
    generatedAt,
    snapshot,
  });

  const zip = buildZipStore([
    { name: 'paciente.pdf', data: pdf },
    { name: 'paciente.json', data: jsonFile(json) },
  ]);
  const storageKey = buildPatientPackageStorageKey(ctx.tenantId, dsrId);

  try {
    await getObjectStorage().putObject(storageKey, zip, 'application/zip');
  } catch (err) {
    if (err instanceof ObjectStorageError) {
      logger.warn({ tenantId: ctx.tenantId, dsrId, requestId: ctx.requestId }, 'patient_package_storage_unavailable');
      return;
    }
    throw err;
  }

  await update.execute(ctx, dsrId, {
    exportKey: storageKey,
    status: dsr.status === 'RECEIVED' ? 'IN_PROGRESS' : undefined,
  });
  logger.info({ tenantId: ctx.tenantId, dsrId, requestId: ctx.requestId }, 'patient_package_ready');
}
