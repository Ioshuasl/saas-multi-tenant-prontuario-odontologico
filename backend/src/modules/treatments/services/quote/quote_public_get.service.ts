import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import { getPatientById, isMinor } from '../../../patients/patients_public.js';
import { resolvePublicTokenByHash } from '../../../scheduling/scheduling_public.js';
import { PublicQuoteTokenError } from '../../models/errors/treatments.errors.js';
import { GetRepository } from '../../repositories/quote/quote_get.repository.js';
import type { PublicQuoteView } from '../../types/quote/quote_decision.types.js';

export class PublicGetService {
  constructor(private readonly get = new GetRepository()) {}

  async execute(requestId: string, rawToken: string): Promise<PublicQuoteView> {
    const token = await resolvePublicTokenByHash(hashToken(rawToken));
    if (!token || token.purpose !== 'QUOTE' || token.usedAt || token.expiresAt.getTime() < Date.now()) {
      throw new PublicQuoteTokenError();
    }
    const quoteId = token.targetId ?? token.meta.quoteId ?? null;
    if (!quoteId) throw new PublicQuoteTokenError();

    const ctx: RequestContext = { tenantId: token.tenantId, userId: '', requestId };
    const quote = await this.get.execute(ctx, quoteId);
    if (!quote || quote.status !== 'SENT') throw new PublicQuoteTokenError();
    const [catalog, patient] = await Promise.all([
      getPublicClinicCatalog(ctx),
      getPatientById(ctx, quote.patientId),
    ]);
    if (!patient) throw new PublicQuoteTokenError();

    const firstName = patient.name.split(/\s+/)[0] ?? patient.name;
    return {
      clinicName: catalog?.name ?? 'Clínica',
      patientFirstName: firstName,
      quoteNumber: quote.number,
      validUntil: quote.validUntil,
      subtotalCents: quote.subtotalCents,
      discountCents: quote.discountCents,
      totalCents: quote.totalCents,
      items: quote.items.map((item) => ({
        id: item.id,
        procedureName: item.procedureName,
        toothCode: item.toothCode,
        face: item.face,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountCents: item.discountCents,
        totalCents: item.totalCents,
      })),
      expiresAt: token.expiresAt.toISOString(),
      requiresGuardian: isMinor(patient.birthDate) || patient.guardians.length > 0,
    };
  }
}
