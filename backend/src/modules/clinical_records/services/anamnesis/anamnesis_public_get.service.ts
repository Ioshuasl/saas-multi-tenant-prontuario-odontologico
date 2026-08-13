import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { getPublicClinicCatalog } from '../../../clinic/clinic_public.js';
import { resolvePublicTokenByHash } from '../../../scheduling/scheduling_public.js';
import { AnamnesisTokenNotFoundError } from '../../models/errors/clinical_records.errors.js';
import { visibleQuestions } from '../../models/anamnesis/anamnesis_answers.model.js';
import { GetRepository as GetFormRepository } from '../../repositories/anamnesis_form/anamnesis_form_get.repository.js';
import { GetRepository as GetPatientSnapshotRepository } from '../../repositories/patient_snapshot/patient_snapshot_get.repository.js';
import type { PublicAnamnesisGetResult } from '../../types/anamnesis/anamnesis_public.types.js';

export class PublicGetService {
  constructor(
    private readonly getForm = new GetFormRepository(),
    private readonly getPatient = new GetPatientSnapshotRepository(),
  ) {}

  async execute(requestId: string, rawToken: string): Promise<PublicAnamnesisGetResult> {
    const token = await resolvePublicTokenByHash(hashToken(rawToken));
    if (!token || token.purpose !== 'ANAMNESIS') {
      throw new AnamnesisTokenNotFoundError();
    }
    if (token.usedAt || token.expiresAt.getTime() < Date.now()) {
      throw new AnamnesisTokenNotFoundError();
    }

    const formId = token.meta.formId ?? null;
    const patientId = token.meta.patientId ?? token.targetId;
    if (!formId || !patientId) throw new AnamnesisTokenNotFoundError();

    const ctx: RequestContext = { tenantId: token.tenantId, userId: '', requestId };
    const [catalog, form, patient] = await Promise.all([
      getPublicClinicCatalog(ctx),
      this.getForm.execute(ctx, formId),
      this.getPatient.execute(ctx, patientId),
    ]);
    if (!form || !patient) throw new AnamnesisTokenNotFoundError();

    return {
      clinicName: catalog?.name ?? 'Clínica',
      patientFirstName: patient.name.split(/\s+/)[0] ?? patient.name,
      form: {
        name: form.name,
        version: form.version,
        questions: visibleQuestions(form.questions, patient.sex),
      },
      expiresAt: token.expiresAt.toISOString(),
    };
  }
}
