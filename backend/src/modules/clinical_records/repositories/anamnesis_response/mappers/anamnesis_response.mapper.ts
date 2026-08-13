import { parseQuestions } from '../../../models/anamnesis/anamnesis_answers.model.js';
import type { AnamnesisAnswers } from '../../../types/anamnesis/anamnesis_question.types.js';
import type { AnamnesisResponseSummary } from '../../../types/anamnesis/anamnesis_list.types.js';

export function mapAnamnesisResponse(row: {
  id: string;
  formId: string;
  formVersion: number;
  answeredBy: string;
  answeredAt: Date;
  signature: unknown;
  answersJson: string;
  formName: string;
  questions: unknown;
}): AnamnesisResponseSummary {
  let answers: AnamnesisAnswers = {};
  try {
    const parsed = JSON.parse(row.answersJson) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      answers = parsed as AnamnesisAnswers;
    }
  } catch {
    answers = {};
  }

  return {
    id: row.id,
    formId: row.formId,
    formVersion: row.formVersion,
    formName: row.formName,
    questions: parseQuestions(row.questions),
    answers,
    answeredBy: row.answeredBy,
    answeredAt: row.answeredAt.toISOString(),
    signature:
      row.signature && typeof row.signature === 'object' && !Array.isArray(row.signature)
        ? (row.signature as Record<string, unknown>)
        : null,
  };
}
