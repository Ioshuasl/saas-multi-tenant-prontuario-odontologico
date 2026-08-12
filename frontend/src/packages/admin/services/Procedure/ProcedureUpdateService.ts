import { ProcedureUpdateData } from '@/packages/admin/data/Procedure/ProcedureUpdateData';
import type { ProcedureUpdateFormValues } from '@/packages/admin/schemas/Procedure/ProcedureSchema';

export async function ProcedureUpdateService(
  procedureId: string,
  procedureSchema: ProcedureUpdateFormValues,
) {
  return ProcedureUpdateData(procedureId, procedureSchema);
}
