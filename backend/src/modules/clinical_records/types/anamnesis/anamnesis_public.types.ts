import type { AnamnesisQuestion } from './anamnesis_question.types.js';

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
