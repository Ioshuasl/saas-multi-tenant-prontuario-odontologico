import { parseQuestions } from '../../../models/anamnesis/anamnesis_answers.model.js';
import type { AnamnesisFormSummary } from '../../../types/anamnesis_form/anamnesis_form.types.js';

export function mapAnamnesisForm(row: {
  id: string;
  name: string;
  version: number;
  active: boolean;
  questions: unknown;
  createdAt: Date;
}): AnamnesisFormSummary {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    active: row.active,
    questions: parseQuestions(row.questions),
    createdAt: row.createdAt.toISOString(),
  };
}
