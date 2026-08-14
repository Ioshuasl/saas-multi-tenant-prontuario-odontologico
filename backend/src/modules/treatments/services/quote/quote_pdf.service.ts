import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getObjectStorage, ObjectStorageError } from '../../../../shared/storage/index.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { QuoteNotFoundError, QuotePdfPendingError } from '../../models/errors/treatments.errors.js';
import { GetPdfKeyRepository } from '../../repositories/quote/quote_send.repository.js';
import type { QuotePdfResult } from '../../types/quote/quote_send.types.js';

const EXPIRES_IN = 900;

export class GetPdfService {
  constructor(private readonly getKey = new GetPdfKeyRepository()) {}

  async execute(ctx: RequestContext, quoteId: string): Promise<QuotePdfResult> {
    const row = await this.getKey.execute(ctx, quoteId);
    if (!row) throw new QuoteNotFoundError();
    if (!row.pdfStorageKey) throw new QuotePdfPendingError();
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
