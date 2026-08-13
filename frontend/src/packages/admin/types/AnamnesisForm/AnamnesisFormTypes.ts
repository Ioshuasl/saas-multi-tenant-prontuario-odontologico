import type { AlertCategory } from '@/packages/admin/enum/AnamnesisForm/AlertCategoryEnum';
import type { AlertSeverity } from '@/packages/admin/enum/AnamnesisForm/AlertSeverityEnum';
import type { QuestionType } from '@/packages/admin/enum/AnamnesisForm/QuestionTypeEnum';

export type AnamnesisAlertWhen = {
  equals?: unknown;
  notEquals?: unknown;
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
  showWhen?: { patientGender?: string };
};

export type AnamnesisFormSummary = {
  id: string;
  name: string;
  version: number;
  active: boolean;
  questions: AnamnesisQuestion[];
  createdAt: string;
};
