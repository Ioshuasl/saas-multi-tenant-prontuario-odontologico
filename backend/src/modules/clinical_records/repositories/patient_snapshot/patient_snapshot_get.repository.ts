import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type PatientSnapshot = {
  id: string;
  name: string;
  sex: string | null;
  email: string | null;
  phonePrimary: string;
};

/** Leitura mínima do paciente no mesmo tenant (evita ciclo clinical_records ↔ patients). */
export class GetRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<PatientSnapshot | null> {
    const tenantPrisma = getTenantPrisma();
    return tenantPrisma.runInTenantContext(ctx, async (tx) => {
      const row = await tx.patient.findFirst({
        where: { tenantId: ctx.tenantId, id: patientId },
        select: { id: true, name: true, sex: true, email: true, phonePrimary: true },
      });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        sex: row.sex,
        email: row.email,
        phonePrimary: row.phonePrimary,
      };
    });
  }
}
