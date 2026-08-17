import type { RequestContext } from '../../../../shared/domain/request_context.js';
import type { DbTransaction } from '../../../../shared/database/db_transaction.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';
import { idGenerator } from '../../../../shared/helpers/id_generator.js';

const MARKETING = 'WHATSAPP_MARKETING';

/** Revoga consentimento de marketing; transacional (DATA_PROCESSING/TERMS) permanece. */
export class RevokeMarketingConsentRepository {
  async execute(ctx: RequestContext, patientId: string): Promise<void> {
    await getTenantPrisma().runInTenantContext(ctx, (tx) => this.executeInTx(tx, ctx, patientId));
  }

  async executeInTx(tx: DbTransaction, ctx: RequestContext, patientId: string): Promise<void> {
    await tx.consent.updateMany({
      where: {
        tenantId: ctx.tenantId,
        patientId,
        type: MARKETING,
        granted: true,
        revokedAt: null,
      },
      data: { revokedAt: new Date(), granted: false },
    });

    await tx.consent.create({
      data: {
        id: idGenerator.next(),
        tenantId: ctx.tenantId,
        patientId,
        type: MARKETING,
        granted: false,
        documentVersion: 'v1',
        channel: 'DSR',
        revokedAt: new Date(),
      },
    });
  }
}
