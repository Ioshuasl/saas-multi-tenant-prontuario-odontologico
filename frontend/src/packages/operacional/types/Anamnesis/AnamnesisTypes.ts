export type AnamnesisQuestion = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
};

export type AnamnesisResponseSummary = {
  id: string;
  formId: string;
  formVersion: number;
  formName: string;
  questions: AnamnesisQuestion[];
  answers: Record<string, unknown>;
  answeredBy: string;
  answeredAt: string;
  signature: Record<string, unknown> | null;
};

export type AnamnesisSendLinkResult = {
  expiresAt: string;
  sentVia: string;
  publicUrl?: string;
};
