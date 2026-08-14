import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import {
  getProcedureById,
  getProfessionalById,
  getPublicClinicCatalog,
} from '../../../clinic/clinic_public.js';
import { getPatientById } from '../../../patients/patients_public.js';
import { CreateAction } from '../../actions/quote/quote_create.action.js';
import { priceQuoteLines, type ProcedurePricing } from '../../models/quote.model.js';
import {
  PatientRequiredError,
  ProcedureInactiveError,
  ProcedureNotFoundError,
  ProfessionalNotFoundError,
} from '../../models/errors/treatments.errors.js';
import { defaultQuoteValidUntil } from '../../helpers/quote_valid_until.helper.js';
import type { QuoteCreateSchema } from '../../schemas/quote.schema.js';
import type { QuoteDto } from '../../types/quote/quote_crud.types.js';

export class CreateService {
  constructor(private readonly createAction = new CreateAction()) {}

  async execute(ctx: RequestContext, quoteSchema: QuoteCreateSchema): Promise<QuoteDto> {
    const patient = await getPatientById(ctx, quoteSchema.patientId);
    if (!patient) throw new PatientRequiredError();

    const professional = await getProfessionalById(ctx, quoteSchema.professionalId);
    if (!professional || !professional.active) throw new ProfessionalNotFoundError();

    const procedures = new Map<string, ProcedurePricing>();
    for (const item of quoteSchema.items) {
      const procedure = await getProcedureById(ctx, item.procedureId);
      if (!procedure) throw new ProcedureNotFoundError();
      if (!procedure.active) throw new ProcedureInactiveError();
      procedures.set(procedure.id, procedure);
    }

    const money = priceQuoteLines(
      quoteSchema.items.map((item) => ({
        procedureId: item.procedureId,
        toothCode: item.toothCode,
        face: item.face,
        quantity: item.quantity ?? 1,
        discountCents: item.discountCents ?? 0,
      })),
      procedures,
      quoteSchema.discountCents ?? 0,
      ctx.role,
    );

    const catalog = await getPublicClinicCatalog(ctx);
    const timezone = catalog?.timezone ?? 'America/Sao_Paulo';
    const validUntilIso = quoteSchema.validUntil ?? defaultQuoteValidUntil(timezone);

    return this.createAction.execute(ctx, {
      unitId: quoteSchema.unitId ?? patient.unitId,
      patientId: patient.id,
      professionalId: professional.id,
      subtotalCents: money.subtotalCents,
      discountCents: money.discountCents,
      totalCents: money.totalCents,
      validUntil: new Date(`${validUntilIso}T00:00:00.000Z`),
      notes: quoteSchema.notes ?? null,
      items: money.lines.map((line) => ({ ...line, id: idGenerator.next() })),
    });
  }
}
