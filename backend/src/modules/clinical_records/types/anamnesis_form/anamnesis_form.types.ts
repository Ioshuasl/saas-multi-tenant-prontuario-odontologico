import type { AnamnesisQuestion } from '../anamnesis/anamnesis_question.types.js';

export type AnamnesisFormSummary = {
  id: string;
  name: string;
  version: number;
  active: boolean;
  questions: AnamnesisQuestion[];
  createdAt: string;
};
