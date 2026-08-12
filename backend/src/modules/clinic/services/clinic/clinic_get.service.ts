import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import { GetProfileRepository } from '../../repositories/tenant/tenant.repository.js';
import type { ClinicProfile } from '../../types/clinic.types.js';

export class GetService {
  constructor(private readonly getProfile = new GetProfileRepository()) {}

  async execute(ctx: RequestContext): Promise<ClinicProfile> {
    const profile = await this.getProfile.execute(ctx);
    if (!profile) {
      throw new AppError('NOT_FOUND', 'Clínica não encontrada.', 404);
    }
    return profile;
  }
}
