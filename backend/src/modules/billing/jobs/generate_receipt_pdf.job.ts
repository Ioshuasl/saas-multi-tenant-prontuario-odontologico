import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { getObjectStorage, ObjectStorageError } from '../../../shared/storage/index.js';
import { getClinicLetterhead } from '../../clinic/clinic_public.js';
import { getPatientById } from '../../patients/patients_public.js';
import { dateOnly } from '../helpers/money.helper.js';
import { receiptPdfStorageKey, renderReceiptPdf } from '../helpers/receipt_pdf.helper.js';
import { GetReceiptRepository, SetPdfKeyRepository } from '../repositories/payment/payment_receipt.repository.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function generateReceiptPdfJob(payload: JobPayload): Promise<void> {
  const paymentId = typeof payload.paymentId === 'string' ? payload.paymentId : '';
  if (!paymentId) return;

  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };

  const receipt = await new GetReceiptRepository().execute(ctx, paymentId);
  if (!receipt) return;
  if (receipt.pdfStorageKey) return;

  const patient = await getPatientById(ctx, receipt.patientId);
  const letterhead = await getClinicLetterhead(ctx, receipt.unitId);
  const storageKey = receiptPdfStorageKey(ctx.tenantId, paymentId);

  const pdf = await renderReceiptPdf({
    clinicName: letterhead?.name ?? 'Clínica',
    legalName: letterhead?.legalName ?? null,
    taxId: letterhead?.taxId ?? null,
    phone: letterhead?.phone ?? null,
    addressLine: letterhead?.addressLine ?? null,
    patientName: patient?.name ?? 'Paciente',
    patientCode: patient?.code ?? 0,
    receiptNumber: Number(receipt.receiptNumber),
    amountCents: receipt.amountCents,
    receivedAt: dateOnly(receipt.receivedAt),
    issuerName: receipt.issuerName,
    receivableId: receipt.receivableId,
    installmentNumber: receipt.installmentNumber,
    methods: receipt.splits,
  });

  try {
    await getObjectStorage().putObject(storageKey, pdf, 'application/pdf');
  } catch (err) {
    if (err instanceof ObjectStorageError) {
      logger.warn({ tenantId: ctx.tenantId, paymentId, requestId: ctx.requestId }, 'receipt_pdf_storage_unavailable');
      return;
    }
    throw err;
  }

  await new SetPdfKeyRepository().execute(ctx, paymentId, storageKey);
  logger.info({ tenantId: ctx.tenantId, paymentId, requestId: ctx.requestId }, 'receipt_pdf_stored');
}