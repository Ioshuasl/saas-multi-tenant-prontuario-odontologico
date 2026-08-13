import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { AppError } from '../../../../shared/middlewares/error_handler.middleware.js';
import {
  DuplicateCpfError,
  InvalidCpfError,
  InvalidPatientNameError,
} from '../../models/errors/patients.errors.js';
import {
  assertPatientName,
  isMinor,
  isValidCpf,
  normalizeCpf,
  normalizePhone,
} from '../../helpers/patient.helper.js';
import { CreateAction } from '../../actions/patient/patient_create.action.js';
import {
  FindByCpfRepository,
  FindByPhoneRepository,
  GetDefaultUnitRepository,
} from '../../repositories/patient/patient.repository.js';
import type { PatientCreateSchema } from '../../schemas/patients.schema.js';
import type { PatientCreateResult, PatientWarning } from '../../types/patients.types.js';

export class CreateService {
  constructor(
    private readonly findByCpf = new FindByCpfRepository(),
    private readonly findByPhone = new FindByPhoneRepository(),
    private readonly getDefaultUnit = new GetDefaultUnitRepository(),
    private readonly createAction = new CreateAction(),
  ) {}

  async execute(
    ctx: RequestContext,
    patientSchema: PatientCreateSchema,
  ): Promise<PatientCreateResult> {
    try {
      assertPatientName(patientSchema.name);
    } catch {
      throw new InvalidPatientNameError();
    }

    const name = patientSchema.name.trim().replace(/\s+/g, ' ');
    const phonePrimary = normalizePhone(patientSchema.phonePrimary);
    if (phonePrimary.length < 10) {
      throw new AppError('VALIDATION_ERROR', 'Telefone principal inválido.', 400);
    }

    let cpf: string | null = null;
    if (patientSchema.cpf) {
      if (!isValidCpf(patientSchema.cpf)) throw new InvalidCpfError();
      cpf = normalizeCpf(patientSchema.cpf);
      const existing = await this.findByCpf.execute(ctx, cpf);
      if (existing) throw new DuplicateCpfError(existing);
    }

    const unitId = patientSchema.unitId ?? (await this.getDefaultUnit.execute(ctx));
    if (!unitId) {
      throw new AppError('VALIDATION_ERROR', 'Unidade padrão não encontrada.', 400);
    }

    const warnings: PatientWarning[] = [];
    const phoneMatches = await this.findByPhone.execute(ctx, phonePrimary);
    if (phoneMatches.length > 0) {
      warnings.push('POSSIBLE_PHONE_DUPLICATE');
    }

    const guardians = (patientSchema.guardians ?? []).map((g) => ({
      name: g.name.trim(),
      cpf: g.cpf && isValidCpf(g.cpf) ? normalizeCpf(g.cpf) : null,
      relationship: g.relationship ?? null,
      phone: g.phone ? normalizePhone(g.phone) : null,
      email: g.email ?? null,
    }));

    if (isMinor(patientSchema.birthDate) && guardians.length === 0) {
      warnings.push('MINOR_WITHOUT_GUARDIAN');
    }

    const patient = await this.createAction.execute(
      ctx,
      {
        unitId,
        name,
        socialName: patientSchema.socialName ?? null,
        cpf,
        birthDate: patientSchema.birthDate ?? null,
        sex: patientSchema.sex ?? null,
        phonePrimary,
        phoneSecondary: patientSchema.phoneSecondary
          ? normalizePhone(patientSchema.phoneSecondary)
          : null,
        email: patientSchema.email ?? null,
        address: patientSchema.address ?? null,
        howFoundUs: patientSchema.howFoundUs ?? null,
        notes: patientSchema.notes ?? null,
        guardians,
      },
      warnings,
    );

    return { patient, warnings };
  }
}
