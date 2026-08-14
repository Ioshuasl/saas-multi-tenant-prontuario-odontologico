import type { JobPayload } from '../../../shared/queue/job_payload.js';
import { logger } from '../../../shared/config/logger.js';
import { getObjectStorage, ObjectStorageError } from '../../../shared/storage/index.js';
import { getClinicLetterhead } from '../../clinic/clinic_public.js';
import { getPatientById } from '../../patients/patients_public.js';
import { GetRepository } from '../repositories/quote/quote_get.repository.js';
import { GetPdfKeyRepository, SetPdfKeyRepository } from '../repositories/quote/quote_send.repository.js';
import { nextQuotePdfStorageKey, renderQuotePdf } from '../helpers/quote_pdf.helper.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export async function generateQuotePdfJob(payload: JobPayload): Promise<void> {
  const quoteId = typeof payload.quoteId === 'string' ? payload.quoteId : '';
  if (!quoteId) return;

  const ctx = {
    tenantId: payload.tenantId,
    userId: SYSTEM_USER_ID,
    requestId: payload.requestId,
  };

  const quote = await new GetRepository().execute(ctx, quoteId);
  if (!quote) return;

  const patient = await getPatientById(ctx, quote.patientId);
  const letterhead = await getClinicLetterhead(ctx, quote.unitId);
  const previous = await new GetPdfKeyRepository().execute(ctx, quoteId);
  const storageKey = nextQuotePdfStorageKey(ctx.tenantId, quoteId, previous?.pdfStorageKey ?? null);

  const pdf = await renderQuotePdf({
    clinicName: letterhead?.name ?? 'Clínica',
    legalName: letterhead?.legalName ?? null,
    taxId: letterhead?.taxId ?? null,
    phone: letterhead?.phone ?? null,
    addressLine: letterhead?.addressLine ?? null,
    responsibleCro: letterhead?.responsibleCro ?? null,
    patientName: patient?.name ?? 'Paciente',
    patientCode: patient?.code ?? 0,
    quoteNumber: quote.number,
    validUntil: quote.validUntil,
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    totalCents: quote.totalCents,
    items: quote.items.map((item) => ({
      procedureName: item.procedureName,
      toothCode: item.toothCode,
      face: item.face,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      discountCents: item.discountCents,
      totalCents: item.totalCents,
    })),
  });

  try {
    await getObjectStorage().putObject(storageKey, pdf, 'application/pdf');
  } catch (err) {
    if (err instanceof ObjectStorageError) {
      logger.warn({ tenantId: ctx.tenantId, quoteId, requestId: ctx.requestId }, 'quote_pdf_storage_unavailable');
      return;
    }
    throw err;
  }

  await new SetPdfKeyRepository().execute(ctx, quoteId, storageKey);
  logger.info({ tenantId: ctx.tenantId, quoteId, requestId: ctx.requestId }, 'quote_pdf_stored');
}
