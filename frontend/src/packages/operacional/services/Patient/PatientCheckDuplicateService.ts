import { PatientCheckDuplicateData } from '@/packages/operacional/data/Patient/PatientCheckDuplicateData';

export async function PatientCheckDuplicateService(input: { cpf?: string; phone?: string }) {
  return PatientCheckDuplicateData(input);
}
