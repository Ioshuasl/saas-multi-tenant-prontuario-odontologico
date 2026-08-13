import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import type { PublicClinicResponse } from '../../types/public_booking.types.js';

export class GetService {
  async execute(ctx: RequestContext): Promise<PublicClinicResponse> {
    const catalog = await getPublicClinicCatalog(ctx);
    if (!catalog) {
      throw new AppError('NOT_FOUND', 'Clínica não encontrada.', 404);
    }
    return {
      name: catalog.name,
      slug: catalog.slug,
      timezone: catalog.timezone,
      procedures: catalog.procedures,
      professionals: catalog.professionals,
    };
  }
}
