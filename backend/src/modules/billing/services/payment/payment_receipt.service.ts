import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { PaymentNotFoundError, ReceiptPdfPendingError } from '../../models/errors/billing.errors.js';
import { GetPdfKeyRepository } from '../../repositories/payment/payment_receipt.repository.js';
import type { ReceiptPdfResult } from '../../types/receipt/receipt.types.js';

const EXPIRES_IN = 900;

export class GetPdfService {
  constructor(private readonly getKey = new GetPdfKeyRepository()) {}

  async execute(ctx: RequestContext, paymentId: string): Promise<ReceiptPdfResult> {
    const row = await this.getKey.execute(ctx, paymentId);
    if (!row) throw new PaymentNotFoundError();
    if (!row.pdfStorageKey) throw new ReceiptPdfPendingError();
    try {
      const signed = await getObjectStorage().presignGet(row.pdfStorageKey, EXPIRES_IN);
      return { url: signed.url, expiresIn: EXPIRES_IN };
    } catch (err) {
      if (err instanceof ObjectStorageError) {
        throw new AppError('STORAGE_UNAVAILABLE', 'Armazenamento indisponível.', 503);
      }
      throw err;
    }
  }
}
