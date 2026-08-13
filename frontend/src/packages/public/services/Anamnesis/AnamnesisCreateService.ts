import { AnamnesisCreateData } from '@/packages/public/data/Anamnesis/AnamnesisCreateData';

export async function AnamnesisCreateService(input: {
  token: string;
  answers: Record<string, unknown>;
}) {
  return AnamnesisCreateData(input.token, input.answers);
}
