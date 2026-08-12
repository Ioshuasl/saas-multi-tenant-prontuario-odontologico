import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { CheckDuplicateRepository } from '../../repositories/patient/patient.repository.js';
import {
  isValidCpf,
  normalizeCpf,
  normalizePhone,
} from '../../helpers/patient.helper.js';
import type { CheckDuplicateQuerySchema } from '../../schemas/patients.schema.js';
import type { CheckDuplicateResult } from '../../types/patients.types.js';
import { InvalidCpfError } from '../../models/errors/patients.errors.js';

export class CheckDuplicateService {
  constructor(private readonly check = new CheckDuplicateRepository()) {}

  async execute(
    ctx: RequestContext,
    query: CheckDuplicateQuerySchema,
  ): Promise<CheckDuplicateResult> {
    let cpf: string | null = null;
    if (query.cpf) {
      if (!isValidCpf(query.cpf)) throw new InvalidCpfError();
      cpf = normalizeCpf(query.cpf);
    }
    const phone = query.phone ? normalizePhone(query.phone) : null;
    return this.check.execute(ctx, { cpf, phone });
  }
}
