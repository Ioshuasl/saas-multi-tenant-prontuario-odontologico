import { AnamnesisSendLinkData } from '@/packages/operacional/data/Anamnesis/AnamnesisSendLinkData';
import type { AnamnesisSendLinkFormValues } from '@/packages/operacional/schemas/Anamnesis/AnamnesisSendLinkSchema';

export async function AnamnesisSendLinkService(input: {
  patientId: string;
  sendLinkSchema: AnamnesisSendLinkFormValues;
}) {
  return AnamnesisSendLinkData(input.patientId, input.sendLinkSchema);
}
