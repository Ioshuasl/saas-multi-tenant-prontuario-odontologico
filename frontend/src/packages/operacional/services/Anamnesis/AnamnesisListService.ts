import { AnamnesisListData } from '@/packages/operacional/data/Anamnesis/AnamnesisListData';

export async function AnamnesisListService(patientId: string) {
  return AnamnesisListData(patientId);
}
