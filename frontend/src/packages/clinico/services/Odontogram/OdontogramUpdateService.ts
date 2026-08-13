import { OdontogramUpdateData } from '@/packages/clinico/data/Odontogram/OdontogramUpdateData';
import type { OdontogramToothUpdateInput } from '@/packages/clinico/types/Odontogram/OdontogramTypes';

export async function OdontogramUpdateService(input: {
  patientId: string;
  toothCode: string;
  odontogramSchema: OdontogramToothUpdateInput;
}) {
  return OdontogramUpdateData(input);
}
