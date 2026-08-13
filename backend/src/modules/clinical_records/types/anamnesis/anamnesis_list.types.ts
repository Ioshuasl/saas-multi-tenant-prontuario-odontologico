import type { AnamnesisQuestion, AnamnesisAnswers } from './anamnesis_question.types.js';

export type AnamnesisResponseSummary = {
  id: string;
  formId: string;
  formVersion: number;
  formName: string;
  questions: AnamnesisQuestion[];
  answers: AnamnesisAnswers;
  answeredBy: string;
  answeredAt: string;
  signature: Record<string, unknown> | null;
};
