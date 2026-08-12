import type { RequestContext } from '../../../../shared/domain/request_context.js';
import {
  DuplicateCpfError,
  InvalidCpfError,
  InvalidPatientNameError,
  PatientNotFoundError,
} from '../../models/errors/patients.errors.js';
import {
  assertPatientName,
  isValidCpf,
  normalizeCpf,
  normalizePhone,
} from '../../helpers/patient.helper.js';
import {
  FindByCpfRepository,
  UpdatePatientRepository,
} from '../../repositories/patient/patient.repository.js';
import type { PatientUpdateSchema } from '../../schemas/patients.schema.js';
import type { PatientSummary } from '../../types/patients.types.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';

export class UpdateService {
  constructor(
    private readonly findByCpf = new FindByCpfRepository(),
    private readonly update = new UpdatePatientRepository(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientId: string,
    patientSchema: PatientUpdateSchema,
  ): Promise<PatientSummary> {
    if (patientSchema.name !== undefined) {
      try {
        assertPatientName(patientSchema.name);
      } catch {
        throw new InvalidPatientNameError();
      }
    }

    let cpf: string | null | undefined = patientSchema.cpf;
    if (cpf !== undefined && cpf !== null) {
      if (!isValidCpf(cpf)) throw new InvalidCpfError();
      cpf = normalizeCpf(cpf);
      const existing = await this.findByCpf.execute(ctx, cpf);
      if (existing && existing.id !== patientId) {
        throw new DuplicateCpfError(existing);
      }
    }

    let phonePrimary = patientSchema.phonePrimary;
    if (phonePrimary !== undefined) {
      phonePrimary = normalizePhone(phonePrimary);
      if (phonePrimary.length < 10) {
        throw new AppError('VALIDATION_ERROR', 'Telefone principal inválido.', 400);
      }
    }

    const updated = await this.update.execute(ctx, patientId, {
      name: patientSchema.name?.trim().replace(/\s+/g, ' '),
      socialName: patientSchema.socialName,
      cpf,
      birthDate: patientSchema.birthDate,
      sex: patientSchema.sex,
      phonePrimary,
      phoneSecondary:
        patientSchema.phoneSecondary === undefined
          ? undefined
          : patientSchema.phoneSecondary
            ? normalizePhone(patientSchema.phoneSecondary)
            : null,
      email: patientSchema.email,
      address: patientSchema.address,
      howFoundUs: patientSchema.howFoundUs,
      notes: patientSchema.notes,
      active: patientSchema.active,
    });

    if (!updated) throw new PatientNotFoundError();
    return updated;
  }
}
