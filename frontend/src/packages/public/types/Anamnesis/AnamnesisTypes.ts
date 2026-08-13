import type { QuestionType } from '@/packages/public/enum/Anamnesis/QuestionTypeEnum';

export type AnamnesisQuestion = {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  options?: string[];
};

export type PublicAnamnesisForm = {
  name: string;
  version: number;
  questions: AnamnesisQuestion[];
};

export type PublicAnamnesisGetResult = {
  clinicName: string;
  patientFirstName: string;
  form: PublicAnamnesisForm;
  expiresAt: string;
};

export type PublicAnamnesisSubmitResult = {
  accepted: true;
};

export type AnamnesisAnswerValue = boolean | string | { value: boolean; text?: string };

export type AnamnesisAnswers = Record<string, AnamnesisAnswerValue>;
