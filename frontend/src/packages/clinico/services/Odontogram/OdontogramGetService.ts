import { OdontogramGetData } from '@/packages/clinico/data/Odontogram/OdontogramGetData';
import type { Dentition } from '@/packages/clinico/enum/Odontogram/DentitionEnum';

export async function OdontogramGetService(patientId: string, dentition: Dentition) {
  return OdontogramGetData(patientId, dentition);
}
