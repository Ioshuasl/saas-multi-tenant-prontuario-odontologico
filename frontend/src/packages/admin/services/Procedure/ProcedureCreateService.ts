import { ProcedureCreateData } from '@/packages/admin/data/Procedure/ProcedureCreateData';
import type { ProcedureCreateFormValues } from '@/packages/admin/schemas/Procedure/ProcedureSchema';

export async function ProcedureCreateService(procedureSchema: ProcedureCreateFormValues) {
  return ProcedureCreateData(procedureSchema);
}
