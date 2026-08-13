import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { resolvePublicTokenByHash } from '../../../scheduling/scheduling_public.js';
import { SubmitAction } from '../../actions/anamnesis/anamnesis_submit.action.js';
import {
  AnamnesisAnswersInvalidError,
  AnamnesisTokenNotFoundError,
} from '../../models/errors/clinical_records.errors.js';
import { validateAnswers, visibleQuestions } from '../../models/anamnesis/anamnesis_answers.model.js';
import { GetRepository as GetFormRepository } from '../../repositories/anamnesis_form/anamnesis_form_get.repository.js';
import { GetRepository as GetPatientSnapshotRepository } from '../../repositories/patient_snapshot/patient_snapshot_get.repository.js';
import type { AnamnesisAnswersSchema } from '../../schemas/anamnesis.schema.js';
import type { PublicAnamnesisSubmitResult } from '../../types/anamnesis/anamnesis_public.types.js';

export class PublicSubmitService {
  constructor(
    private readonly getForm = new GetFormRepository(),
    private readonly getPatient = new GetPatientSnapshotRepository(),
    private readonly submit = new SubmitAction(),
  ) {}

  async execute(
    requestId: string,
    rawToken: string,
    anamnesisSchema: AnamnesisAnswersSchema,
    signatureExtra: { ip?: string; userAgent?: string },
  ): Promise<PublicAnamnesisSubmitResult> {
    const token = await resolvePublicTokenByHash(hashToken(rawToken));
    if (!token || token.purpose !== 'ANAMNESIS') {
      throw new AnamnesisTokenNotFoundError();
    }
    if (token.expiresAt.getTime() < Date.now()) {
      throw new AnamnesisTokenNotFoundError();
    }
    if (token.usedAt) {
      return { accepted: true };
    }

    const formId = token.meta.formId ?? null;
    const patientId = token.meta.patientId ?? token.targetId;
    if (!formId || !patientId) throw new AnamnesisTokenNotFoundError();

    const ctx: RequestContext = { tenantId: token.tenantId, userId: '', requestId };
    const form = await this.getForm.execute(ctx, formId);
    const patient = await this.getPatient.execute(ctx, patientId);
    if (!form || !patient) throw new AnamnesisTokenNotFoundError();
    if (token.meta.formVersion !== undefined && token.meta.formVersion !== form.version) {
      throw new AnamnesisTokenNotFoundError();
    }

    const questions = visibleQuestions(form.questions, patient.sex);
    const issues = validateAnswers(questions, anamnesisSchema.answers);
    if (issues.length > 0) throw new AnamnesisAnswersInvalidError(issues);

    await this.submit.execute(ctx, {
      patientId,
      formId: form.id,
      formVersion: form.version,
      questions,
      answers: anamnesisSchema.answers,
      answeredBy: 'PATIENT',
      signatureExtra,
      tokenId: token.id,
    });

    return { accepted: true };
  }
}
