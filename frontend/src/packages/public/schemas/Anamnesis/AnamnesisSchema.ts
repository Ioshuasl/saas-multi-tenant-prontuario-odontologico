import { z } from 'zod';
import type { AnamnesisQuestion } from '@/packages/public/types/Anamnesis/AnamnesisTypes';

export type AnamnesisAnswersFormValues = Record<string, unknown>;

const booleanField = z.boolean({
  required_error: 'Responda sim ou não',
  invalid_type_error: 'Responda sim ou não',
});

const booleanWithTextField = z.object({
  value: booleanField,
  text: z.string().max(500).optional(),
});

export function defaultAnamnesisAnswers(questions: AnamnesisQuestion[]): AnamnesisAnswersFormValues {
  const values: AnamnesisAnswersFormValues = {};
  for (const question of questions) {
    if (question.type === 'BOOLEAN_WITH_TEXT') {
      values[question.id] = { text: '' };
    } else if (question.type === 'BOOLEAN') {
      values[question.id] = undefined;
    } else {
      values[question.id] = '';
    }
  }
  return values;
}

export function createAnamnesisAnswersSchema(questions: AnamnesisQuestion[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const question of questions) {
    if (question.type === 'BOOLEAN') {
      shape[question.id] = question.required ? booleanField : booleanField.optional();
      continue;
    }
    if (question.type === 'BOOLEAN_WITH_TEXT') {
      if (question.required) {
        shape[question.id] = booleanWithTextField;
      } else {
        shape[question.id] = z.preprocess((value) => {
          if (!value || typeof value !== 'object') return undefined;
          if (!('value' in value) || (value as { value?: unknown }).value === undefined) {
            return undefined;
          }
          return value;
        }, booleanWithTextField.optional());
      }
      continue;
    }
    if (question.type === 'SINGLE_CHOICE') {
      shape[question.id] = question.required
        ? z.string().min(1, 'Selecione uma opção')
        : z.string().optional();
      continue;
    }
    shape[question.id] = question.required
      ? z.string().min(1, 'Campo obrigatório')
      : z.string().optional();
  }
  return z.object(shape);
}

export function toAnamnesisAnswersPayload(
  questions: AnamnesisQuestion[],
  values: AnamnesisAnswersFormValues,
): Record<string, unknown> {
  const answers: Record<string, unknown> = {};
  for (const question of questions) {
    const value = values[question.id];
    if (value === undefined || value === null || value === '') continue;
    if (
      question.type === 'BOOLEAN_WITH_TEXT' &&
      typeof value === 'object' &&
      value !== null &&
      (value as { value?: unknown }).value === undefined
    ) {
      continue;
    }
    answers[question.id] = value;
  }
  return answers;
}
