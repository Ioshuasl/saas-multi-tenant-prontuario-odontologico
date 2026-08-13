import { z } from 'zod';
import { ALERT_CATEGORIES } from '@/packages/admin/enum/AnamnesisForm/AlertCategoryEnum';
import { ALERT_SEVERITIES } from '@/packages/admin/enum/AnamnesisForm/AlertSeverityEnum';
import { QUESTION_TYPES } from '@/packages/admin/enum/AnamnesisForm/QuestionTypeEnum';
import type { AnamnesisFormSummary } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';
import type { AnamnesisQuestion } from '@/packages/admin/types/AnamnesisForm/AnamnesisFormTypes';

export const AnamnesisFormQuestionSchema = z.object({
  id: z.string().min(1, 'Id obrigatório').max(80),
  label: z.string().min(1, 'Pergunta obrigatória').max(500),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  optionsText: z.string().optional(),
  alertMode: z.enum(['none', 'equals', 'notEquals']),
  alertValue: z.string().optional(),
  alertSeverity: z.enum(ALERT_SEVERITIES),
  alertCategory: z.enum(ALERT_CATEGORIES),
  showWhenGender: z.string().optional(),
});

export const AnamnesisFormCreateSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(120),
  questions: z.array(AnamnesisFormQuestionSchema).min(1, 'Inclua ao menos uma pergunta'),
});

export type AnamnesisFormQuestionFormValues = z.infer<typeof AnamnesisFormQuestionSchema>;
export type AnamnesisFormCreateFormValues = z.infer<typeof AnamnesisFormCreateSchema>;

export const EMPTY_ANAMNESIS_QUESTION: AnamnesisFormQuestionFormValues = {
  id: 'pergunta_1',
  label: '',
  type: 'TEXT',
  required: false,
  optionsText: '',
  alertMode: 'none',
  alertValue: '',
  alertSeverity: 'WARNING',
  alertCategory: 'OTHER',
  showWhenGender: '',
};

export function anamnesisFormToFormValues(
  form: AnamnesisFormSummary,
): AnamnesisFormCreateFormValues {
  return {
    name: form.name,
    questions: form.questions.map((question) => ({
      id: question.id,
      label: question.label,
      type: question.type,
      required: question.required ?? false,
      optionsText: question.options?.join(', ') ?? '',
      alertMode:
        question.alertWhen && 'equals' in question.alertWhen
          ? 'equals'
          : question.alertWhen && 'notEquals' in question.alertWhen
            ? 'notEquals'
            : 'none',
      alertValue:
        question.alertWhen && 'equals' in question.alertWhen
          ? String(question.alertWhen.equals)
          : question.alertWhen && 'notEquals' in question.alertWhen
            ? String(question.alertWhen.notEquals)
            : '',
      alertSeverity: question.alertSeverity ?? 'WARNING',
      alertCategory: question.alertCategory ?? 'OTHER',
      showWhenGender: question.showWhen?.patientGender ?? '',
    })),
  };
}

function parseAlertValue(raw: string | undefined): unknown {
  if (raw == null) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  return trimmed;
}

export function toAnamnesisFormQuestions(
  questions: AnamnesisFormQuestionFormValues[],
): AnamnesisQuestion[] {
  return questions.map((question) => {
    const options =
      question.type === 'SINGLE_CHOICE'
        ? (question.optionsText ?? '')
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean)
        : undefined;
    const alertWhen =
      question.alertMode === 'equals'
        ? { equals: parseAlertValue(question.alertValue) }
        : question.alertMode === 'notEquals'
          ? { notEquals: parseAlertValue(question.alertValue) }
          : undefined;

    return {
      id: question.id.trim(),
      label: question.label.trim(),
      type: question.type,
      required: question.required || undefined,
      options: options?.length ? options : undefined,
      alertWhen,
      alertSeverity: alertWhen ? question.alertSeverity : undefined,
      alertCategory: alertWhen ? question.alertCategory : undefined,
      showWhen: question.showWhenGender?.trim()
        ? { patientGender: question.showWhenGender.trim() }
        : undefined,
    };
  });
}
