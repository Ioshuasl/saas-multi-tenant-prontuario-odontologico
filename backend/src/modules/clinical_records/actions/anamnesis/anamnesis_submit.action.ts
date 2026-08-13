import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { UnitOfWork } from '../../../../shared/database/unit_of_work.js';
import { hashToken } from '../../../../shared/helpers/token_hash.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';
import { markPublicTokenUsed } from '../../../scheduling/scheduling_public.js';
import { EnsureRepository } from '../../repositories/medical_record/medical_record_ensure.repository.js';
import { CreateRepository as CreateResponseRepository } from '../../repositories/anamnesis_response/anamnesis_response_create.repository.js';
import { CreateRepository as CreateAlertRepository } from '../../repositories/clinical_alert/clinical_alert_create.repository.js';
import { DeactivateAnamnesisRepository } from '../../repositories/clinical_alert/clinical_alert_deactivate_anamnesis.repository.js';
import {
  canonicalAnswers,
  evaluateAlerts,
} from '../../models/anamnesis/anamnesis_answers.model.js';
import type { AnamnesisAnswers, AnamnesisQuestion } from '../../types/anamnesis/anamnesis_question.types.js';
import type { AnamnesisCreateResult } from '../../types/anamnesis/anamnesis_create.types.js';

export type SubmitAnamnesisInput = {
  patientId: string;
  formId: string;
  formVersion: number;
  questions: AnamnesisQuestion[];
  answers: AnamnesisAnswers;
  answeredBy: 'PATIENT' | 'PROFESSIONAL';
  signatureExtra?: Record<string, unknown>;
  tokenId?: string;
};

export class SubmitAction {
  constructor(
    private readonly uow = new UnitOfWork(),
    private readonly ensure = new EnsureRepository(),
    private readonly createResponse = new CreateResponseRepository(),
    private readonly deactivateAnamnesis = new DeactivateAnamnesisRepository(),
    private readonly createAlert = new CreateAlertRepository(),
  ) {}

  async execute(ctx: RequestContext, input: SubmitAnamnesisInput): Promise<AnamnesisCreateResult> {
    const responseId = idGenerator.next();
    const signature = {
      type: 'SIMPLE',
      hash: hashToken(canonicalAnswers(input.answers)),
      ...(input.signatureExtra ?? {}),
    };

    return this.uow.run(ctx, async ({ tx, publish }) => {
      const record = await this.ensure.executeInTx(tx, ctx, input.patientId);
      await this.createResponse.executeInTx(tx, ctx, {
        id: responseId,
        medicalRecordId: record.medicalRecordId,
        formId: input.formId,
        formVersion: input.formVersion,
        answers: input.answers,
        answeredBy: input.answeredBy,
        signature,
      });

      await this.deactivateAnamnesis.executeInTx(tx, ctx, record.medicalRecordId);

      const generated = evaluateAlerts(input.questions, input.answers);
      for (const alert of generated) {
        const alertId = idGenerator.next();
        await this.createAlert.executeInTx(tx, ctx, {
          id: alertId,
          medicalRecordId: record.medicalRecordId,
          severity: alert.severity,
          category: alert.category,
          description: alert.description,
          source: 'ANAMNESIS',
        });
        if (alert.severity === 'CRITICAL') {
          publish([
            {
              name: 'clinical_records.critical_alert_created',
              payload: {
                alertId,
                patientId: input.patientId,
                medicalRecordId: record.medicalRecordId,
                requestId: ctx.requestId,
              },
            },
          ]);
        }
      }

      if (input.tokenId) {
        await markPublicTokenUsed(ctx, input.tokenId, tx);
      }

      return { id: responseId, accepted: true as const };
    });
  }
}
