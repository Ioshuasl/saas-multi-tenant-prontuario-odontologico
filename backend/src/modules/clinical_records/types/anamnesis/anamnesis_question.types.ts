import type { AlertCategory } from '../../enum/clinical_alert/alert_category.enum.js';
import type { AlertSeverity } from '../../enum/clinical_alert/alert_severity.enum.js';
import type { QuestionType } from '../../enum/anamnesis/question_type.enum.js';

export type AnamnesisAlertWhen = {
  equals?: unknown;
  notEquals?: unknown;
};

export type AnamnesisShowWhen = {
  patientGender?: string;
};

export type AnamnesisQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
  alertWhen?: AnamnesisAlertWhen;
  alertSeverity?: AlertSeverity;
  alertCategory?: AlertCategory;
  showWhen?: AnamnesisShowWhen;
};

export type AnamnesisAnswers = Record<string, unknown>;
