import { AnamnesisGetData } from '@/packages/public/data/Anamnesis/AnamnesisGetData';

export async function AnamnesisGetService(token: string) {
  return AnamnesisGetData(token);
}
