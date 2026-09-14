import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import {
  anonymizedName,
  anonymizedPhone,
  isAnonymizedName,
} from '../../helpers/patient_anonymize.helper.js';

export type AnonymizePatientResult = { found: boolean; changed: boolean };

/** Substitui identificadores diretos. Idempotente. Não toca prontuário. */
export class AnonymizeRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<AnonymizePatientResult> {
    return getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, patientId));
  }

  async executeInTx(
    tx: DbTransaction,
    ctx: RequestContext,
    patientId: string,
  ): Promise<AnonymizePatientResult> {
    const row = await tx.patient.findFirst({
      where: { id: patientId, tenantId: ctx.tenantId },
      select: { id: true, name: true },
    });
    if (!row) return { found: false, changed: false };
    if (isAnonymizedName(row.name)) return { found: true, changed: false };

    await tx.patient.update({
      where: { id: patientId },
      data: {
        name: anonymizedName(patientId),
        socialName: null,
        cpf: null,
        phonePrimary: anonymizedPhone(patientId),
        phoneSecondary: null,
        email: null,
        address: { set: null },
        howFoundUs: null,
        notes: null,
        photoKey: null,
      },
    });

    await tx.legalGuardian.updateMany({
      where: { tenantId: ctx.tenantId, patientId },
      data: {
        name: anonymizedName(`${patientId}:guardian`),
        cpf: null,
        phone: anonymizedPhone(`${patientId}:guardian`),
        email: null,
      },
    });

    return { found: true, changed: true };
  }
}
